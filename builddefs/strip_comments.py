import os
import re
import sys

def main(argv):
  src_path = argv[1]
  out_path = argv[2]

  with open(src_path, "r") as file:
    src_str = file.read()

  # Code from Markus Jarderot, posted to stackoverflow
  def replacer(match):
    s = match.group(0)
    if s.startswith('/'):
        return ""
    else:
        return s
  pattern = re.compile(
      r'//.*?$|/\*.*?\*/|\'(?:\\.|[^\\\'])*\'|"(?:\\.|[^\\"])*"',
      re.DOTALL | re.MULTILINE)
  out_str = re.sub(pattern, replacer, src_str)

  with open(out_path, "w") as file:
    file.write(out_str)

  return 0

if __name__ == "__main__":
  sys.exit(main(sys.argv))
