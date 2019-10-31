#include "wtf/buffer.h"

#include <cstdlib>
#include <sstream>
#include <vector>

#include "gtest/gtest.h"

#ifndef TMP_PREFIX
#define TMP_PREFIX ""
#endif

namespace wtf {
namespace {

static const OutputBuffer::ChunkHeader kDefaultChunkHeader{1, 2, 3, 4};

class BufferTest : public ::testing::Test {
 protected:
  void TearDown() override {}

  std::vector<uint32_t> ExtractSlots(const std::string& s) {
    std::vector<uint32_t> slots;
    slots.resize(s.size() / 4);
    memcpy(&slots[0], &s[0], 4 * s.size() / 4);
    return slots;
  }

  bool DummyWriteAndClearEventBuffer(EventBuffer* eb) {
    OutputBuffer::PartHeader part_header;
    eb->PopulateHeader(&part_header);
    std::stringstream stream;
    OutputBuffer output_buffer(&stream);
    return eb->WriteTo(&part_header, &output_buffer, true);
  }
};

TEST_F(BufferTest, StringTableDedups) {
  StringTable st;
  int id1 = st.GetStringId("Hello");
  int id2 = st.GetStringId("Goodbye");
  int id3 = st.GetStringId("Hello");
  EXPECT_GE(0, id1);
  EXPECT_EQ(id1, id3);
  EXPECT_EQ(id1 + 1, id2);
}

TEST_F(BufferTest, Serialization_StringTable0) {
  StringTable st;
  // Ordinarily, the empty string is filtered out at a higher level, but the
  // string table should also filter for consistency.
  int id1 = st.GetStringId("");
  EXPECT_EQ(-1, id1);  // Empty string should not be stored.

  OutputBuffer::PartHeader header;
  st.PopulateHeader(&header);

  std::stringstream stream;
  OutputBuffer output_buffer(&stream);
  output_buffer.StartChunk(kDefaultChunkHeader, &header, 1);
  EXPECT_TRUE(st.WriteTo(&header, &output_buffer));
  ASSERT_EQ(0U, stream.str().size() % 4);
  auto slots = ExtractSlots(stream.str());
  EXPECT_EQ((std::vector<uint32_t>{
                1, 2,  // Chunk header fields.
                36,    // Chunk length.
                3, 4,  // Chunk header fields.
                1,     // Part count.
                // -- String table part header.
                0x30000,  // String table part type.
                0,        // Part offset.
                0,        // Part length.
            }),
            slots);
}

TEST_F(BufferTest, Serialization_StringTable1) {
  StringTable st;
  int id1 = st.GetStringId("\xee");
  EXPECT_EQ(0, id1);

  OutputBuffer::PartHeader header;
  st.PopulateHeader(&header);

  std::stringstream stream;
  OutputBuffer output_buffer(&stream);
  output_buffer.StartChunk(kDefaultChunkHeader, &header, 1);
  EXPECT_TRUE(st.WriteTo(&header, &output_buffer));
  ASSERT_EQ(0U, stream.str().size() % 4);
  auto slots = ExtractSlots(stream.str());
  EXPECT_EQ((std::vector<uint32_t>{
                1, 2,  // Chunk header fields.
                40,    // Chunk length.
                3, 4,  // Chunk header fields.
                1,     // Part count.
                // -- String table part header.
                0x30000,  // String table part type.
                0,        // Part offset.
                2,        // Part length.
                // -- String table payload.
                0x00ee,  // String char ee + nul (LE).
            }),
            slots);
}

TEST_F(BufferTest, Serialization_StringTable1_EmptyEventBuffer) {
  StringTable st;
  int id1 = st.GetStringId("\xee");  // 238 decimal.
  EXPECT_EQ(0, id1);

  EventBuffer eb;

  OutputBuffer::PartHeader st_header;
  st.PopulateHeader(&st_header);

  OutputBuffer::PartHeader eb_header;
  eb.PopulateHeader(&eb_header);

  OutputBuffer::PartHeader headers[] = {st_header, eb_header};
  std::stringstream stream;
  OutputBuffer output_buffer(&stream);
  output_buffer.StartChunk(kDefaultChunkHeader, headers, 2);
  EXPECT_TRUE(st.WriteTo(&st_header, &output_buffer));
  EXPECT_TRUE(eb.WriteTo(&eb_header, &output_buffer, false));
  ASSERT_EQ(0U, stream.str().size() % 4);
  auto slots = ExtractSlots(stream.str());
  EXPECT_EQ((std::vector<uint32_t>{
                1, 2,  // Chunk header fields.
                52,    // Chunk length.
                3, 4,  // Chunk header fields.
                2,     // Part count.
                // -- String table part header.
                0x30000,  // String table part type.
                0,        // Part offset.
                2,        // Part length.
                // -- Event buffer part header.
                0x20002,  // Event buffer part type.
                4,        // Part offset.
                0,        // Part length.
                // -- String table payload.
                0x00ee,  // String char ee + nul (LE).
                         // -- Event buffer payload.
            }),
            slots);
}

TEST_F(BufferTest, Serialization_StringTable1_EventBufferFlushed) {
  StringTable st;
  int id1 = st.GetStringId("\xee");  // 238 decimal.
  EXPECT_EQ(0, id1);

  EventBuffer eb;
  auto* eb_slots = eb.AddSlots(4);
  eb_slots[0] = 44;
  eb_slots[1] = 45;
  eb_slots[2] = 46;
  eb_slots[3] = 47;
  eb.Flush();

  OutputBuffer::PartHeader st_header;
  st.PopulateHeader(&st_header);

  OutputBuffer::PartHeader eb_header;
  eb.PopulateHeader(&eb_header);

  OutputBuffer::PartHeader headers[] = {st_header, eb_header};
  std::stringstream stream;
  OutputBuffer output_buffer(&stream);
  output_buffer.StartChunk(kDefaultChunkHeader, headers, 2);
  EXPECT_TRUE(st.WriteTo(&st_header, &output_buffer));
  EXPECT_TRUE(eb.WriteTo(&eb_header, &output_buffer, false));
  ASSERT_EQ(0U, stream.str().size() % 4);
  auto slots = ExtractSlots(stream.str());
  EXPECT_EQ((std::vector<uint32_t>{1, 2,  // Chunk header fields.
                                   68,    // Chunk length.
                                   3, 4,  // Chunk header fields.
                                   2,     // Part count.
                                   // -- String table part header.
                                   0x30000,  // String table part type.
                                   0,        // Part offset.
                                   2,        // Part length.
                                   // -- Event buffer part header.
                                   0x20002,  // Event buffer part type.
                                   4,        // Part offset.
                                   16,       // Part length.
                                   // -- String table payload.
                                   0x00ee,  // String char ee + nul (LE).
                                   // -- Event buffer payload.
                                   44, 45, 46, 47}),
            slots);
}

TEST_F(BufferTest, Serialization_StringTable1_EventBufferClearAppend) {
  StringTable st;
  int id1 = st.GetStringId("\xee");  // 238 decimal.
  EXPECT_EQ(0, id1);

  EventBuffer eb;
  auto* eb_slots = eb.AddSlots(4);
  eb_slots[0] = 44;
  eb_slots[1] = 45;
  eb_slots[2] = 46;
  eb_slots[3] = 47;
  eb.Flush();
  eb.FreezePrefixSlots();
  eb_slots = eb.AddSlots(2);
  eb_slots[0] = 48;
  eb_slots[1] = 49;
  eb.Flush();

  // Clear and then write some more.
  ASSERT_TRUE(DummyWriteAndClearEventBuffer(&eb));
  eb_slots = eb.AddSlots(2);
  eb_slots[0] = 50;
  eb_slots[1] = 51;
  eb.Flush();

  OutputBuffer::PartHeader st_header;
  st.PopulateHeader(&st_header);

  OutputBuffer::PartHeader eb_header;
  eb.PopulateHeader(&eb_header);

  OutputBuffer::PartHeader headers[] = {st_header, eb_header};
  std::stringstream stream;
  OutputBuffer output_buffer(&stream);
  output_buffer.StartChunk(kDefaultChunkHeader, headers, 2);
  EXPECT_TRUE(st.WriteTo(&st_header, &output_buffer));
  EXPECT_TRUE(eb.WriteTo(&eb_header, &output_buffer, false));
  ASSERT_EQ(0U, stream.str().size() % 4);
  auto slots = ExtractSlots(stream.str());
  EXPECT_EQ((std::vector<uint32_t>{
                1, 2,  // Chunk header fields.
                76,    // Chunk length.
                3, 4,  // Chunk header fields.
                2,     // Part count.
                // -- String table part header.
                0x30000,  // String table part type.
                0,        // Part offset.
                2,        // Part length.
                // -- Event buffer part header.
                0x20002,  // Event buffer part type.
                4,        // Part offset.
                24,       // Part length.
                // -- String table payload.
                0x00ee,  // String char ee + nul (LE).
                // -- Event buffer payload.
                44, 45, 46, 47, 50, 51,
            }),
            slots);
}

TEST_F(BufferTest, Serialization_StringTable1_EventBufferClearUnflushed) {
  StringTable st;
  int id1 = st.GetStringId("\xee");  // 238 decimal.
  EXPECT_EQ(0, id1);

  EventBuffer eb;
  auto* eb_slots = eb.AddSlots(4);
  eb_slots[0] = 44;
  eb_slots[1] = 45;
  eb_slots[2] = 46;
  eb_slots[3] = 47;
  eb.Flush();
  eb.FreezePrefixSlots();
  eb_slots = eb.AddSlots(2);
  eb_slots[0] = 48;
  eb_slots[1] = 49;
  eb.Flush();

  // Clear and then write some more.
  ASSERT_TRUE(DummyWriteAndClearEventBuffer(&eb));
  eb_slots = eb.AddSlots(2);
  eb_slots[0] = 50;
  eb_slots[1] = 51;
  // No flush.

  OutputBuffer::PartHeader st_header;
  st.PopulateHeader(&st_header);

  OutputBuffer::PartHeader eb_header;
  eb.PopulateHeader(&eb_header);

  OutputBuffer::PartHeader headers[] = {st_header, eb_header};
  std::stringstream stream;
  OutputBuffer output_buffer(&stream);
  output_buffer.StartChunk(kDefaultChunkHeader, headers, 2);
  EXPECT_TRUE(st.WriteTo(&st_header, &output_buffer));
  EXPECT_TRUE(eb.WriteTo(&eb_header, &output_buffer, false));
  ASSERT_EQ(0U, stream.str().size() % 4);
  auto slots = ExtractSlots(stream.str());
  EXPECT_EQ((std::vector<uint32_t>{
                1, 2,  // Chunk header fields.
                68,    // Chunk length.
                3, 4,  // Chunk header fields.
                2,     // Part count.
                // -- String table part header.
                0x30000,  // String table part type.
                0,        // Part offset.
                2,        // Part length.
                // -- Event buffer part header.
                0x20002,  // Event buffer part type.
                4,        // Part offset.
                16,       // Part length.
                // -- String table payload.
                0x00ee,  // String char ee + nul (LE).
                // -- Event buffer payload.
                44, 45, 46, 47,
            }),
            slots);
}

TEST_F(BufferTest, EventBufferExpandAndClear) {
  const uint32_t kChunkSlots = 512;
  EventBuffer eb(kChunkSlots * sizeof(uint32_t));

  // Commit a prefix.
  auto* eb_slots = eb.AddSlots(4);
  eb_slots[0] = 44;
  eb_slots[1] = 45;
  eb_slots[2] = 46;
  eb_slots[3] = 47;
  eb.Flush();
  eb.FreezePrefixSlots();

  // Write 2 slots under the limit.
  eb_slots = eb.AddSlots(kChunkSlots - 2);
  for (uint32_t i = 0; i < kChunkSlots - 2; i++) {
    eb_slots[i] = i;
  }
  eb.Flush();

  // Write 4 - which should overflow into the next chunk.
  eb_slots = eb.AddSlots(4);
  eb_slots[0] = 54;
  eb_slots[1] = 55;
  eb_slots[2] = 56;
  eb_slots[3] = 57;
  eb.Flush();

  // Dump and clear.
  OutputBuffer::PartHeader eb_header;
  eb.PopulateHeader(&eb_header);
  size_t expected_length = ((kChunkSlots - 2) + 8) * 4;
  EXPECT_EQ(expected_length, eb_header.length);
  std::stringstream stream;
  OutputBuffer output_buffer(&stream);
  EXPECT_TRUE(eb.WriteTo(&eb_header, &output_buffer, true));
  ASSERT_EQ(0U, stream.str().size() % 4);
  auto slots = ExtractSlots(stream.str());

  // Verify.
  int i = 0;
  EXPECT_EQ(44U, slots[i++]);
  EXPECT_EQ(45U, slots[i++]);
  EXPECT_EQ(46U, slots[i++]);
  EXPECT_EQ(47U, slots[i++]);
  for (uint32_t count = 0; count < kChunkSlots - 2; count++) {
    EXPECT_EQ(count, slots[i++]);
  }
  EXPECT_EQ(54U, slots[i++]);
  EXPECT_EQ(55U, slots[i++]);
  EXPECT_EQ(56U, slots[i++]);
  EXPECT_EQ(57U, slots[i++]);

  // Now that it is cleared, write a bit more and verify.
  eb_slots = eb.AddSlots(4);
  eb_slots[0] = 64;
  eb_slots[1] = 65;
  eb_slots[2] = 66;
  eb_slots[3] = 67;
  eb.Flush();

  eb.PopulateHeader(&eb_header);
  EXPECT_EQ(8 * sizeof(uint32_t), eb_header.length);
  std::stringstream stream2;
  OutputBuffer output_buffer2(&stream2);
  EXPECT_TRUE(eb.WriteTo(&eb_header, &output_buffer2, true));
  ASSERT_EQ(0U, stream2.str().size() % 4);
  slots = ExtractSlots(stream2.str());

  i = 0;
  EXPECT_EQ(44U, slots[i++]);
  EXPECT_EQ(45U, slots[i++]);
  EXPECT_EQ(46U, slots[i++]);
  EXPECT_EQ(47U, slots[i++]);
  EXPECT_EQ(64U, slots[i++]);
  EXPECT_EQ(65U, slots[i++]);
  EXPECT_EQ(66U, slots[i++]);
  EXPECT_EQ(67U, slots[i++]);
}

}  // namespace
}  // namespace wtf

int main(int argc, char** argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
