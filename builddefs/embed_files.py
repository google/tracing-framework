import base64
import os
import sys

def main(argv):
  encoding = argv[1]
  template_path = argv[2]
  out_path = argv[3]
  src_path = argv[4]

  with open(src_path, "r") as file:
    src_str = file.read()

  if encoding == 'base64':
    src_str = base64.b64encode(src_str)
  else:
    src_str = src_str.replace('\n', '\\n')
    src_str = src_str.replace('\'', '\\\'')

  sanitized_src_path = src_path
  sanitized_src_str = src_str

  with open(template_path, "r") as file:
    template_str = file.read()

  out_str = template_str
  out_str = out_str.replace('%output%', sanitized_src_str)
  out_str = out_str.replace('%path%', sanitized_src_path)

  with open(out_path, "w") as file:
    file.write(out_str)

  return 0

if __name__ == "__main__":
  sys.exit(main(sys.argv))
