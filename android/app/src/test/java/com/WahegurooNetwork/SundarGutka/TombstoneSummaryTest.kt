package com.WahegurooNetwork.SundarGutka

import java.io.ByteArrayOutputStream
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The tombstone reader is the only window onto a native crash inside a system
 * library, so it is checked against buffers built to tombstone.proto's field
 * numbers, including the ways a real one can be awkward: the crashing thread
 * listed after others, fields this reader does not know, and truncation.
 */
class TombstoneSummaryTest {
  // A minimal protobuf writer, enough to build test tombstones.
  private class Proto {
    private val out = ByteArrayOutputStream()

    private fun varint(value: Long) {
      var v = value
      while (v and 0x7fL.inv() != 0L) {
        out.write(((v and 0x7f) or 0x80).toInt())
        v = v ushr 7
      }
      out.write(v.toInt())
    }

    fun int(field: Int, value: Long) = apply {
      varint((field shl 3).toLong())
      varint(value)
    }

    fun bytes(field: Int, value: ByteArray) = apply {
      varint(((field shl 3) or 2).toLong())
      varint(value.size.toLong())
      out.write(value)
    }

    fun text(field: Int, value: String) = bytes(field, value.toByteArray())

    fun msg(field: Int, value: Proto) = bytes(field, value.build())

    fun fixed64(field: Int) = apply {
      varint(((field shl 3) or 1).toLong())
      out.write(ByteArray(8))
    }

    fun build(): ByteArray = out.toByteArray()
  }

  private fun frame(pc: Long, function: String, file: String) =
      Proto().int(1, pc).int(2, pc + 0x7000_0000L).text(4, function).int(5, 12).text(6, file)

  private fun thread(id: Long, name: String, vararg frames: Proto) =
      Proto().int(1, id).text(2, name).apply { frames.forEach { msg(4, it) } }

  private fun entry(id: Long, thread: Proto) = Proto().int(1, id).msg(2, thread)

  private fun tombstone(): Proto =
      Proto()
          .int(1, 1) // arch: ARM64
          .text(2, "realme/RMX3201/RMX3201:11/RP1A.200720.011/1:user/release-keys")
          .int(5, 4100) // pid
          .int(6, 4242) // tid: the crashing thread
          .msg(
              10,
              Proto().int(1, 11).text(2, "SIGSEGV").int(3, 1).text(4, "SEGV_MAPERR")
                  .int(8, 1).int(9, 0x10))
          .text(14, "")
          .msg(15, Proto().text(1, "null pointer dereference"))
          .msg(16, entry(4100, thread(4100, "main", frame(0x100, "art::Main", "/system/lib64/libc.so"))))
          .msg(
              16,
              entry(
                  4242,
                  thread(
                      4242,
                      "RenderThread",
                      frame(0x2a3c40, "art::gc::Heap::Collect", "/apex/com.android.art/lib64/libart.so"),
                      frame(0x1000, "", "/system/lib64/libhwui.so"))))
          .fixed64(99) // a field this reader does not know
          .msg(17, Proto().int(1, 0).int(2, 4096)) // memory mapping, skipped

  @Test
  fun readsTheCrashingThreadNotTheFirstOne() {
    val summary = TombstoneSummary.parse(tombstone().build())!!

    assertEquals("SIGSEGV", summary.signal)
    assertEquals("SEGV_MAPERR", summary.code)
    assertEquals(0x10L, summary.faultAddress)
    assertEquals(listOf("null pointer dereference"), summary.causes)
    assertEquals("RenderThread", summary.threadName)
    assertEquals(4242L, summary.tid)
    assertEquals(2, summary.frames.size)
    assertEquals("art::gc::Heap::Collect", summary.frames[0].functionName)
    assertEquals(0x2a3c40L, summary.frames[0].relPc)
  }

  @Test
  fun printsLikeTheSystemsOwnTombstone() {
    val lines = TombstoneSummary.parse(tombstone().build())!!.lines()

    assertEquals("signal SIGSEGV (SEGV_MAPERR) fault addr 0x10", lines[0])
    assertEquals("cause: null pointer dereference", lines[1])
    assertEquals("thread: RenderThread (tid 4242)", lines[2])
    assertEquals(
        "#00 pc 00000000002a3c40  /apex/com.android.art/lib64/libart.so (art::gc::Heap::Collect+12)",
        lines[3])
    // A frame the device could not symbolise still shows where it was.
    assertEquals("#01 pc 0000000000001000  /system/lib64/libhwui.so", lines[4])
  }

  @Test
  fun keepsAtMostTheFramesThatFitAReport() {
    val frames = Array(TombstoneSummary.MAX_FRAMES + 10) { frame(it.toLong(), "f$it", "/lib.so") }
    val bytes = Proto().int(6, 7).msg(16, entry(7, thread(7, "worker", *frames))).build()

    assertEquals(TombstoneSummary.MAX_FRAMES, TombstoneSummary.parse(bytes)!!.frames.size)
  }

  @Test
  fun aTruncatedTombstoneStillYieldsWhatWasReadBeforeTheCut() {
    val whole = tombstone().build()
    // Cut inside the last thread entry: the signal survives, nothing throws.
    val cut = whole.copyOf(whole.size - 40)

    val summary = TombstoneSummary.parse(cut)!!
    assertEquals("SIGSEGV", summary.signal)
    assertTrue(summary.lines().isNotEmpty())
  }

  @Test
  fun anAbsentFaultAddressIsNotReportedAsZero() {
    val bytes = Proto().int(6, 1).msg(10, Proto().text(2, "SIGABRT").text(4, "SI_TKILL")).build()

    val summary = TombstoneSummary.parse(bytes)!!
    assertNull(summary.faultAddress)
    assertEquals("signal SIGABRT (SI_TKILL)", summary.lines()[0])
  }

  @Test
  fun garbageIsNotATombstone() {
    assertNull(TombstoneSummary.parse(ByteArray(0)))
    assertNull(TombstoneSummary.parse(byteArrayOf(0x7f, 0x7f, 0x7f)))
  }
}
