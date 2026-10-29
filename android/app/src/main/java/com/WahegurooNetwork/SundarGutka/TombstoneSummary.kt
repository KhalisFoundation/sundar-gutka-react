package com.WahegurooNetwork.SundarGutka

/**
 * Turns the system's tombstone for a native crash into a few readable lines.
 *
 * From Android 12, ApplicationExitInfo.getTraceInputStream() hands an app the
 * tombstone debuggerd wrote for its own native crash, as a protocol buffer
 * (AOSP system/core/debuggerd/proto/tombstone.proto). It is the only place an
 * app can see a crash inside a SYSTEM library the way the platform saw it: the
 * signal, the fault address, the abort message and the crashing thread's
 * backtrace, already symbolised on the device. Crashlytics cannot do that for
 * libart.so, so its reports of those crashes arrive with no frames at all.
 *
 * Only the handful of fields that explain a crash are read, by hand, so the app
 * needs no protobuf runtime. Unknown fields are skipped by wire type, which is
 * what keeps this working when the schema grows. A truncated or malformed
 * buffer yields whatever was read before the damage, never an exception.
 */
object TombstoneSummary {
  /** Frames kept from the crashing thread: enough to see the call path. */
  const val MAX_FRAMES = 24

  data class Frame(
      val relPc: Long,
      val functionName: String,
      val functionOffset: Long,
      val fileName: String,
  )

  data class Summary(
      val signal: String,
      val code: String,
      val faultAddress: Long?,
      val abortMessage: String,
      val causes: List<String>,
      val threadName: String,
      val tid: Long,
      val frames: List<Frame>,
  ) {
    /** The tombstone's own layout, so it reads like `adb logcat` output. */
    fun lines(): List<String> =
        buildList {
          val fault = faultAddress?.let { " fault addr 0x%x".format(it) } ?: ""
          add("signal ${signal.ifEmpty { "?" }} (${code.ifEmpty { "?" }})$fault")
          if (abortMessage.isNotEmpty()) add("abort: $abortMessage")
          causes.forEach { add("cause: $it") }
          add("thread: ${threadName.ifEmpty { "?" }} (tid $tid)")
          frames.forEachIndexed { i, f ->
            val symbol =
                if (f.functionName.isEmpty()) "" else " (${f.functionName}+${f.functionOffset})"
            add("#%02d pc %016x  %s%s".format(i, f.relPc, f.fileName, symbol))
          }
        }
  }

  // Field numbers from tombstone.proto.
  private const val TOMBSTONE_TID = 6
  private const val TOMBSTONE_SIGNAL = 10
  private const val TOMBSTONE_ABORT = 14
  private const val TOMBSTONE_CAUSES = 15
  private const val TOMBSTONE_THREADS = 16
  private const val SIGNAL_NAME = 2
  private const val SIGNAL_CODE_NAME = 4
  private const val SIGNAL_HAS_FAULT = 8
  private const val SIGNAL_FAULT_ADDRESS = 9
  private const val CAUSE_TEXT = 1
  private const val MAP_KEY = 1
  private const val MAP_VALUE = 2
  private const val THREAD_NAME = 2
  private const val THREAD_BACKTRACE = 4
  private const val FRAME_REL_PC = 1
  private const val FRAME_FUNCTION = 4
  private const val FRAME_OFFSET = 5
  private const val FRAME_FILE = 6

  /** Null when the buffer holds no recognisable tombstone at all. */
  fun parse(bytes: ByteArray): Summary? {
    var tid = -1L
    var signal = ""
    var code = ""
    var faultAddress: Long? = null
    var abort = ""
    val causes = mutableListOf<String>()
    // Thread bodies are kept as slices and only the crashing one is decoded:
    // the tid is a separate field and the map can carry every thread's
    // registers and memory dumps.
    val threads = mutableMapOf<Long, Slice>()

    Reader(bytes, 0, bytes.size).forEachField { field, value ->
      when (field) {
        TOMBSTONE_TID -> tid = value.varint
        TOMBSTONE_ABORT -> abort = value.text()
        TOMBSTONE_CAUSES ->
            value.message()?.forEachField { f, v -> if (f == CAUSE_TEXT) causes += v.text() }
        TOMBSTONE_SIGNAL -> {
          var hasFault = false
          var address = 0L
          value.message()?.forEachField { f, v ->
            when (f) {
              SIGNAL_NAME -> signal = v.text()
              SIGNAL_CODE_NAME -> code = v.text()
              SIGNAL_HAS_FAULT -> hasFault = v.varint != 0L
              SIGNAL_FAULT_ADDRESS -> address = v.varint
            }
          }
          if (hasFault) faultAddress = address
        }
        TOMBSTONE_THREADS -> {
          var key = -1L
          var body: Slice? = null
          value.message()?.forEachField { f, v ->
            when (f) {
              MAP_KEY -> key = v.varint
              MAP_VALUE -> body = v.slice
            }
          }
          body?.let { threads[key] = it }
        }
      }
    }

    if (tid < 0 && signal.isEmpty() && threads.isEmpty()) return null

    var threadName = ""
    val frames = mutableListOf<Frame>()
    threads[tid]?.let { slice ->
      Reader(bytes, slice.start, slice.end).forEachField { f, v ->
        when (f) {
          THREAD_NAME -> threadName = v.text()
          THREAD_BACKTRACE -> if (frames.size < MAX_FRAMES) v.message()?.let { frames += frame(it) }
        }
      }
    }
    return Summary(signal, code, faultAddress, abort, causes, threadName, tid, frames)
  }

  private fun frame(reader: Reader): Frame {
    var relPc = 0L
    var function = ""
    var offset = 0L
    var file = ""
    reader.forEachField { f, v ->
      when (f) {
        FRAME_REL_PC -> relPc = v.varint
        FRAME_FUNCTION -> function = v.text()
        FRAME_OFFSET -> offset = v.varint
        FRAME_FILE -> file = v.text()
      }
    }
    return Frame(relPc, function, offset, file)
  }

  private data class Slice(val start: Int, val end: Int)

  /** One field's payload: a varint, or a length-delimited slice of the buffer. */
  private class Value(private val bytes: ByteArray, val varint: Long, val slice: Slice?) {
    fun text(): String =
        slice?.let { String(bytes, it.start, it.end - it.start, Charsets.UTF_8) } ?: ""

    fun message(): Reader? = slice?.let { Reader(bytes, it.start, it.end) }
  }

  private class Reader(private val bytes: ByteArray, start: Int, private val end: Int) {
    private var pos = start

    /** Calls [visit] for every field it can read in full, then stops. */
    fun forEachField(visit: (Int, Value) -> Unit) {
      while (pos < end) {
        val tag = readVarint() ?: return
        val field = (tag ushr 3).toInt()
        when ((tag and 7).toInt()) {
          WIRE_VARINT -> visit(field, Value(bytes, readVarint() ?: return, null))
          WIRE_FIXED64 -> if (!skip(8)) return
          WIRE_LENGTH -> {
            val length = readVarint() ?: return
            if (length < 0 || length > end - pos) return
            val slice = Slice(pos, pos + length.toInt())
            pos = slice.end
            visit(field, Value(bytes, 0L, slice))
          }
          WIRE_FIXED32 -> if (!skip(4)) return
          // Groups (3, 4) are not used by this schema; anything else is damage.
          else -> return
        }
      }
    }

    private fun skip(count: Int): Boolean {
      if (count > end - pos) return false
      pos += count
      return true
    }

    private fun readVarint(): Long? {
      var result = 0L
      var shift = 0
      while (pos < end && shift < 64) {
        val b = bytes[pos++].toInt()
        result = result or ((b and 0x7f).toLong() shl shift)
        if (b and 0x80 == 0) return result
        shift += 7
      }
      return null
    }

    private companion object {
      const val WIRE_VARINT = 0
      const val WIRE_FIXED64 = 1
      const val WIRE_LENGTH = 2
      const val WIRE_FIXED32 = 5
    }
  }
}
