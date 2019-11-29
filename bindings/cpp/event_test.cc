#include "wtf/event.h"

#include <fstream>

#include "gtest/gtest.h"

namespace wtf {
namespace {

class EventTest : public ::testing::Test {
 protected:
  void TearDown() override {}

  EventDefinition CreateEventDefinition(const char *name_spec) {
    return EventDefinition::Create<int, const char*>(
        /*wire_id=*/0, EventClass::kScoped, /*flags=*/0, name_spec);
  }

  EventDefinition CreateEventDefinition0(const char *name_spec) {
    return EventDefinition::Create(
        /*wire_id=*/0, EventClass::kScoped, /*flags=*/0, name_spec);
  }
};


TEST_F(EventTest, CheckNameSpecParsing) {
  std::string output;

  auto event = CreateEventDefinition("MyFunc");
  event.AppendName(&output);
  EXPECT_EQ(output, "MyFunc");
  output.clear();
  event.AppendArguments(&output);
  EXPECT_EQ(output, "int32 a0, ascii a1");

  output.clear();
  event = CreateEventDefinition("MyNamespace::MyClass::MyFunc");
  event.AppendName(&output);
  EXPECT_EQ(output, "MyNamespace::MyClass::MyFunc");
  output.clear();
  event.AppendArguments(&output);
  EXPECT_EQ(output, "int32 a0, ascii a1");

  output.clear();
  event = CreateEventDefinition("MyClass::MyFunc2:  arg1 , arg2");
  event.AppendName(&output);
  EXPECT_EQ(output, "MyClass::MyFunc2");
  output.clear();
  event.AppendArguments(&output);
  EXPECT_EQ(output, "int32 arg1, ascii arg2");

  output.clear();
  event = CreateEventDefinition("MyFunc2:  arg1 , arg2");
  event.AppendName(&output);
  EXPECT_EQ(output, "MyFunc2");
  output.clear();
  event.AppendArguments(&output);
  EXPECT_EQ(output, "int32 arg1, ascii arg2");

  output.clear();
  event = CreateEventDefinition("MyFunc3:  arg1");
  event.AppendName(&output);
  EXPECT_EQ(output, "MyFunc3");
  output.clear();
  event.AppendArguments(&output);
  EXPECT_EQ(output, "int32 arg1, ascii a1");

  output.clear();
  event = CreateEventDefinition0("MyMethodNoArgs");
  event.AppendName(&output);
  EXPECT_EQ(output, "MyMethodNoArgs");
  output.clear();
  event.AppendArguments(&output);
  EXPECT_EQ(output, "");

  output.clear();
  event = CreateEventDefinition0("-[MyMethod looksLikeObjC:hasColons:]");
  event.AppendName(&output);
  EXPECT_EQ(output, "-[MyMethod looksLikeObjC:hasColons:]");
  output.clear();
  event.AppendArguments(&output);
  EXPECT_EQ(output, "");
}

}  // namespace
}  // namespace wtf

int main(int argc, char** argv) {
  ::testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
