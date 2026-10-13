package com.sundargutka.gradle;

import com.android.build.api.instrumentation.AsmClassVisitorFactory;
import com.android.build.api.instrumentation.ClassContext;
import com.android.build.api.instrumentation.ClassData;
import com.android.build.api.instrumentation.InstrumentationParameters;
import org.gradle.api.GradleException;
import org.objectweb.asm.ClassVisitor;
import org.objectweb.asm.Label;
import org.objectweb.asm.MethodVisitor;
import org.objectweb.asm.Opcodes;
import org.objectweb.asm.Type;
import org.objectweb.asm.commons.TryCatchBlockSorter;

/**
 * Rewrites four React Native runtime classes as they are packaged into the APK.
 *
 * <p>React Native's Android runtime arrives as the prebuilt {@code
 * com.facebook.react:react-android} AAR from Maven Central. Nothing under {@code
 * node_modules/react-native/ReactAndroid} is ever compiled, so a patch-package patch of that source
 * is inert: it edits a copy of the code no build step reads. The only place left to change these
 * classes is the bytecode, which is what the Android Gradle Plugin's instrumentation API is for.
 *
 * <p>Three crashes are addressed, all long-standing upstream races that still throw on React Native
 * main:
 *
 * <ul>
 *   <li>{@code JSApplicationIllegalArgumentException: connectAnimatedNodes: Animated node with tag
 *       (child) [n] does not exist}, and its siblings across the rest of
 *       NativeAnimatedNodesManager. The animated graph is driven by operations queued on one thread
 *       and drained on another, so an operation can name a node that teardown has already dropped.
 *       React Native's own comment for the same race inside {@code updateNodes} calls the correct
 *       response "eat the exception rather than crashing... the impact is that we may drop one or
 *       more frames of the animation". This applies that response to every entry point of the class.
 *   <li>{@code IllegalArgumentException: Mapped property node does not exist} from {@code
 *       PropsAnimatedNode.updateView}. That is the same race one level down, and it escapes the
 *       guard React Native already has because {@code updateNodes} catches only
 *       JSApplicationCausedNativeException while {@code updateView} raises a plain
 *       IllegalArgumentException.
 *   <li>{@code IllegalArgumentException: Invalid parent node provided} from {@code
 *       InterpolationAnimatedNode.onDetachedFromNode}. The same race again, reached through {@code
 *       disconnectAnimatedNodes}: the node was already detached, or re-attached elsewhere, before the
 *       queued disconnect ran. Kotlin's {@code require} throws a plain IllegalArgumentException, so
 *       the class-wide guard on NativeAnimatedNodesManager, which catches only the JS-caused type,
 *       lets it through. Guarding the method itself keeps the rest of {@code removeChild} running,
 *       so the parent still drops the child and only the stale detach is skipped.
 * </ul>
 *
 * <p>And one serialization crash: {@code folly::toJson: JSON object value was a NaN} when the
 * platform VelocityTracker yields a non-finite scroll velocity.
 *
 * <p>Nothing is silenced. Every swallowed throwable is reported through React Native's own
 * soft-exception channel.
 *
 * <p>If a React Native upgrade changes the shape of any of these classes, the build FAILS rather
 * than quietly dropping the guard.
 */
public abstract class AnimatedCrashGuard
    implements AsmClassVisitorFactory<InstrumentationParameters.None> {

  private static final String NODES_MANAGER =
      "com.facebook.react.animated.NativeAnimatedNodesManager";
  private static final String PROPS_NODE = "com.facebook.react.animated.PropsAnimatedNode";
  private static final String INTERPOLATION_NODE =
      "com.facebook.react.animated.InterpolationAnimatedNode";
  private static final String SCROLL_EVENT = "com.facebook.react.views.scroll.ScrollEvent";
  private static final String UI_IMPLEMENTATION = "com.facebook.react.uimanager.UIImplementation";

  private static final String SHADOW_NODE_REGISTRY = "com/facebook/react/uimanager/ShadowNodeRegistry";
  private static final String READABLE_ARRAY = "com/facebook/react/bridge/ReadableArray";
  private static final String NO_CRASH_SOFT_EXCEPTION =
      "com/facebook/react/bridge/ReactNoCrashSoftException";

  /** React Native's marker for "JS sent a bad command; the instance is still healthy". */
  private static final String JS_CAUSED =
      "com/facebook/react/bridge/JSApplicationCausedNativeException";

  private static final String ILLEGAL_ARGUMENT = "java/lang/IllegalArgumentException";
  private static final String SOFT_LOGGER = "com/facebook/react/bridge/ReactSoftExceptionLogger";
  private static final String WRITABLE_MAP = "com/facebook/react/bridge/WritableMap";

  @Override
  public boolean isInstrumentable(ClassData classData) {
    String name = classData.getClassName();
    return NODES_MANAGER.equals(name)
        || PROPS_NODE.equals(name)
        || INTERPOLATION_NODE.equals(name)
        || SCROLL_EVENT.equals(name)
        || UI_IMPLEMENTATION.equals(name);
  }

  @Override
  public ClassVisitor createClassVisitor(ClassContext classContext, ClassVisitor next) {
    String name = classContext.getCurrentClassData().getClassName();
    if (NODES_MANAGER.equals(name)) {
      return new GuardEveryVoidMethod(next, JS_CAUSED, "NativeAnimatedNodesManager");
    }
    if (PROPS_NODE.equals(name)) {
      return new GuardOneMethod(next, "updateView", "()V", ILLEGAL_ARGUMENT, "PropsAnimatedNode");
    }
    if (INTERPOLATION_NODE.equals(name)) {
      return new GuardOneMethod(
          next,
          "onDetachedFromNode",
          "(Lcom/facebook/react/animated/AnimatedNode;)V",
          ILLEGAL_ARGUMENT,
          "InterpolationAnimatedNode");
    }
    if (UI_IMPLEMENTATION.equals(name)) {
      return new MakeSetChildrenAtomic(next);
    }
    return new CoerceNonFiniteDoubles(next);
  }

  /**
   * Wraps every void method of NativeAnimatedNodesManager, so a node tag that no longer resolves
   * costs a dropped frame instead of the process. Covering the whole class rather than only the
   * methods named in the crash reports is deliberate: every entry point looks a node up by tag and
   * throws the same way, and a later React Native version may move which one loses the race.
   */
  private static final class GuardEveryVoidMethod extends ClassVisitor {
    private final String catchType;
    private final String category;
    private int guarded;

    GuardEveryVoidMethod(ClassVisitor next, String catchType, String category) {
      super(Opcodes.ASM9, next);
      this.catchType = catchType;
      this.category = category;
    }

    @Override
    public MethodVisitor visitMethod(
        int access, String name, String descriptor, String signature, String[] exceptions) {
      MethodVisitor mv = super.visitMethod(access, name, descriptor, signature, exceptions);
      if (mv == null || !isGuardable(access, name, descriptor)) {
        return mv;
      }
      guarded++;
      return guard(mv, access, name, descriptor, signature, exceptions, catchType, category);
    }

    @Override
    public void visitEnd() {
      super.visitEnd();
      if (guarded == 0) {
        throw new GradleException(
            "AnimatedCrashGuard found no void methods to guard in "
                + category
                + ". React Native's animated runtime has changed shape, so the crash guard would "
                + "silently do nothing. Re-check it against the new version.");
      }
    }
  }

  /** Wraps a single named method. Used where a blanket guard would be too broad. */
  private static final class GuardOneMethod extends ClassVisitor {
    private final String target;
    private final String targetDescriptor;
    private final String catchType;
    private final String category;
    private boolean found;

    GuardOneMethod(
        ClassVisitor next,
        String target,
        String targetDescriptor,
        String catchType,
        String category) {
      super(Opcodes.ASM9, next);
      this.target = target;
      this.targetDescriptor = targetDescriptor;
      this.catchType = catchType;
      this.category = category;
    }

    @Override
    public MethodVisitor visitMethod(
        int access, String name, String descriptor, String signature, String[] exceptions) {
      MethodVisitor mv = super.visitMethod(access, name, descriptor, signature, exceptions);
      if (mv == null || !target.equals(name) || !targetDescriptor.equals(descriptor)) {
        return mv;
      }
      found = true;
      return guard(mv, access, name, descriptor, signature, exceptions, catchType, category);
    }

    @Override
    public void visitEnd() {
      super.visitEnd();
      if (!found) {
        throw new GradleException(
            "AnimatedCrashGuard could not find "
                + category
                + "."
                + target
                + targetDescriptor
                + ". React Native has changed it, so the crash guard would silently do nothing. "
                + "Re-check it against the new version.");
      }
    }
  }

  /**
   * Coerces every non-finite double written into a scroll event's payload to zero. The platform
   * VelocityTracker can produce NaN or Infinity on a fling, and serializing one crashes
   * folly::toJson while it is building the event for JS. Zero is what a non-finite velocity or
   * offset already means to a reader; the alternative is losing the process.
   */
  private static final class CoerceNonFiniteDoubles extends ClassVisitor {
    private int coerced;

    CoerceNonFiniteDoubles(ClassVisitor next) {
      super(Opcodes.ASM9, next);
    }

    @Override
    public MethodVisitor visitMethod(
        int access, String name, String descriptor, String signature, String[] exceptions) {
      MethodVisitor mv = super.visitMethod(access, name, descriptor, signature, exceptions);
      if (mv == null || !"getEventData".equals(name)) {
        return mv;
      }
      return new MethodVisitor(Opcodes.ASM9, mv) {
        @Override
        public void visitMethodInsn(
            int opcode, String owner, String target, String desc, boolean isInterface) {
          if (WRITABLE_MAP.equals(owner)
              && "putDouble".equals(target)
              && "(Ljava/lang/String;D)V".equals(desc)) {
            // Stack here is: .. map, key, value
            Label finite = new Label();
            super.visitInsn(Opcodes.DUP2);
            super.visitMethodInsn(
                Opcodes.INVOKESTATIC, "java/lang/Double", "isFinite", "(D)Z", false);
            super.visitJumpInsn(Opcodes.IFNE, finite);
            super.visitInsn(Opcodes.POP2);
            super.visitInsn(Opcodes.DCONST_0);
            super.visitLabel(finite);
            coerced++;
          }
          super.visitMethodInsn(opcode, owner, target, desc, isInterface);
        }
      };
    }

    @Override
    public void visitEnd() {
      super.visitEnd();
      if (coerced == 0) {
        throw new GradleException(
            "AnimatedCrashGuard found no double values in ScrollEvent.getEventData to make finite. "
                + "React Native has changed the event payload, so the folly::toJson guard would "
                + "silently do nothing.");
      }
    }
  }

  /**
   * Makes {@code UIImplementation.setChildren} all-or-nothing.
   *
   * <p>The method resolves each child tag and attaches it as it goes, then hands the finished list
   * to the native hierarchy. If a tag has been dropped it throws {@code IllegalViewOperationException:
   * Trying to add unknown view tag}, but only after earlier children are already attached and before
   * the native side is told about any of them. So the crash cannot be handled the way the animated
   * ones are: catching it would leave the shadow tree holding children the native tree has never
   * seen, which is worse than the crash it replaces.
   *
   * <p>Instead every tag is resolved up front, inside the same lock the body runs under, and the
   * whole operation is abandoned before it mutates anything if one is missing. The two outcomes are
   * "the batch applied" and "the batch did not", with no state in between. A skipped batch costs a
   * subtree that React will rebuild on its next update; the alternative is losing the process.
   *
   * <p>The check must hold {@code uiImplementationThreadLock}: the registry is a plain SparseArray
   * that other threads mutate, so resolving tags outside the lock would be both racy and unsound.
   */
  private static final class MakeSetChildrenAtomic extends ClassVisitor {
    private static final String OWNER = "com/facebook/react/uimanager/UIImplementation";
    private static final String SHADOW_NODE = "com/facebook/react/uimanager/ReactShadowNode";
    /** Above anything the original method uses, so no local of its own is disturbed. */
    private static final int LOCK_SLOT = 10;

    private static final int INDEX_SLOT = 11;

    private boolean instrumented;

    MakeSetChildrenAtomic(ClassVisitor next) {
      super(Opcodes.ASM9, next);
    }

    private void resolveNode(MethodVisitor mv) {
      mv.visitMethodInsn(
          Opcodes.INVOKEVIRTUAL, SHADOW_NODE_REGISTRY, "getNode", "(I)L" + SHADOW_NODE + ";", false);
    }

    private void loadRegistry(MethodVisitor mv) {
      mv.visitVarInsn(Opcodes.ALOAD, 0);
      mv.visitFieldInsn(
          Opcodes.GETFIELD, OWNER, "mShadowNodeRegistry", "L" + SHADOW_NODE_REGISTRY + ";");
    }

    @Override
    public MethodVisitor visitMethod(
        int access, String name, String descriptor, String signature, String[] exceptions) {
      MethodVisitor mv = super.visitMethod(access, name, descriptor, signature, exceptions);
      if (mv == null
          || !"setChildren".equals(name)
          || !("(IL" + READABLE_ARRAY + ";)V").equals(descriptor)) {
        return mv;
      }
      return new MethodVisitor(Opcodes.ASM9, mv) {
        private boolean placed;

        @Override
        public void visitInsn(int opcode) {
          if (opcode != Opcodes.MONITORENTER || placed) {
            super.visitInsn(opcode);
            return;
          }
          placed = true;
          instrumented = true;

          Label bail = new Label();
          Label loop = new Label();
          Label proceed = new Label();
          Label guardStart = new Label();
          Label guardEnd = new Label();
          Label guardFailed = new Label();

          // The synchronized block's own handler only covers the original body, so a
          // throw from this check would leave the monitor held and hang the UI thread
          // forever, which is worse than the crash being prevented. Catching anything
          // here and falling through means the worst case is the unpatched behaviour.
          super.visitTryCatchBlock(guardStart, guardEnd, guardFailed, null);

          // Stack holds the lock. Keep our own reference so bailing out can release
          // it without depending on which local the compiler happened to choose.
          super.visitInsn(Opcodes.DUP);
          super.visitVarInsn(Opcodes.ASTORE, LOCK_SLOT);
          super.visitInsn(Opcodes.MONITORENTER);
          super.visitLabel(guardStart);

          // The parent, which the original body dereferences without checking.
          loadRegistry(this);
          super.visitVarInsn(Opcodes.ILOAD, 1);
          resolveNode(this);
          super.visitJumpInsn(Opcodes.IFNULL, bail);

          // Then every child, before a single one is attached.
          super.visitInsn(Opcodes.ICONST_0);
          super.visitVarInsn(Opcodes.ISTORE, INDEX_SLOT);
          super.visitLabel(loop);
          super.visitVarInsn(Opcodes.ILOAD, INDEX_SLOT);
          super.visitVarInsn(Opcodes.ALOAD, 2);
          super.visitMethodInsn(Opcodes.INVOKEINTERFACE, READABLE_ARRAY, "size", "()I", true);
          super.visitJumpInsn(Opcodes.IF_ICMPGE, proceed);
          loadRegistry(this);
          super.visitVarInsn(Opcodes.ALOAD, 2);
          super.visitVarInsn(Opcodes.ILOAD, INDEX_SLOT);
          super.visitMethodInsn(Opcodes.INVOKEINTERFACE, READABLE_ARRAY, "getInt", "(I)I", true);
          resolveNode(this);
          super.visitJumpInsn(Opcodes.IFNULL, bail);
          super.visitIincInsn(INDEX_SLOT, 1);
          super.visitJumpInsn(Opcodes.GOTO, loop);

          super.visitLabel(bail);
          super.visitLdcInsn("UIImplementation.setChildren");
          super.visitTypeInsn(Opcodes.NEW, NO_CRASH_SOFT_EXCEPTION);
          super.visitInsn(Opcodes.DUP);
          super.visitLdcInsn("setChildren skipped: a view tag in the batch no longer exists");
          super.visitMethodInsn(
              Opcodes.INVOKESPECIAL,
              NO_CRASH_SOFT_EXCEPTION,
              "<init>",
              "(Ljava/lang/String;)V",
              false);
          super.visitMethodInsn(
              Opcodes.INVOKESTATIC,
              SOFT_LOGGER,
              "logSoftException",
              "(Ljava/lang/String;Ljava/lang/Throwable;)V",
              false);
          super.visitVarInsn(Opcodes.ALOAD, LOCK_SLOT);
          super.visitInsn(Opcodes.MONITOREXIT);
          super.visitInsn(Opcodes.RETURN);

          super.visitLabel(guardEnd);
          super.visitLabel(guardFailed);
          super.visitInsn(Opcodes.POP);
          super.visitLabel(proceed);
        }

        @Override
        public void visitMaxs(int maxStack, int maxLocals) {
          super.visitMaxs(Math.max(maxStack, 5), Math.max(maxLocals, INDEX_SLOT + 1));
        }
      };
    }

    @Override
    public void visitEnd() {
      super.visitEnd();
      if (!instrumented) {
        throw new GradleException(
            "AnimatedCrashGuard could not find a synchronized UIImplementation.setChildren to make "
                + "atomic. React Native has changed it, so the guard would silently do nothing. "
                + "Re-check it against the new version.");
      }
    }
  }

  private static boolean isGuardable(int access, String name, String descriptor) {
    if ((access & (Opcodes.ACC_ABSTRACT | Opcodes.ACC_NATIVE | Opcodes.ACC_SYNTHETIC)) != 0) {
      return false;
    }
    if (name.startsWith("<")) {
      return false;
    }
    return Type.getReturnType(descriptor).getSort() == Type.VOID;
  }

  /**
   * Wraps a void method body in a catch that reports and returns.
   *
   * <p>TryCatchBlockSorter puts the new whole-method handler last in the exception table, so any
   * handler the method already declares still wins for the range it covers. Without it, a blanket
   * block registered first would pre-empt React Native's own narrower catches.
   */
  private static MethodVisitor guard(
      MethodVisitor mv,
      int access,
      String name,
      String descriptor,
      String signature,
      String[] exceptions,
      String catchType,
      String category) {
    MethodVisitor sorted =
        new TryCatchBlockSorter(mv, access, name, descriptor, signature, exceptions);
    return new SwallowAndReport(sorted, catchType, category + "." + name);
  }

  private static final class SwallowAndReport extends MethodVisitor {
    private final String catchType;
    private final String category;
    private final Label start = new Label();
    private final Label end = new Label();
    private final Label handler = new Label();

    SwallowAndReport(MethodVisitor mv, String catchType, String category) {
      super(Opcodes.ASM9, mv);
      this.catchType = catchType;
      this.category = category;
    }

    @Override
    public void visitCode() {
      super.visitCode();
      super.visitTryCatchBlock(start, end, handler, catchType);
      super.visitLabel(start);
    }

    @Override
    public void visitMaxs(int maxStack, int maxLocals) {
      super.visitLabel(end);
      super.visitLabel(handler);
      // Stack: throwable. Report it through React Native's own soft-exception
      // channel so the race stays visible in logs, then abandon the operation.
      super.visitLdcInsn(category);
      super.visitInsn(Opcodes.SWAP);
      super.visitMethodInsn(
          Opcodes.INVOKESTATIC,
          SOFT_LOGGER,
          "logSoftException",
          "(Ljava/lang/String;Ljava/lang/Throwable;)V",
          false);
      super.visitInsn(Opcodes.RETURN);
      super.visitMaxs(maxStack, maxLocals);
    }
  }
}
