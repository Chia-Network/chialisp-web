import sys
import subprocess
from colorama import Fore, Style

examples = []

with open("docs/ref/lang_reference.md") as f:
    in_chialisp_block = False
    current_example = None
    line_num = -1
    for line in f:
        line_num += 1
        if in_chialisp_block:
            if "```" in line:
                if current_example is not None:
                    print(Fore.RED + "ERROR: " + Style.RESET_ALL + f"line: {line_num}, expected result from example:\n{current_example}")
                    sys.exit(1)
                in_chialisp_block = False
            elif " => " in line:
                if current_example is None:
                    example, result = line.split(" => ")
                    example = example.strip()
                    result = result.split(";")[0].strip()
                    if example == "":
                        print(Fore.RED + "ERROR: " + Style.RESET_ALL + f"line: {line_num}, result without example expression:\n{line}")
                        sys.exit(1)
                    examples.append((example, result))
                else:
                    result = line.split("=>")[1].split(";")[0].strip()
                    examples.append((current_example, result))
                    current_example = None
            elif "(" in line:
                if current_example is not None:
                    print(Fore.RED + "ERROR: " + Style.RESET_ALL + f"line: {line_num}, example where a result was expected:\n{line}")
                    sys.exit(1)
                current_example = line.split(";")[0].strip()
            else:
                if line.strip() != "":
                    print(Fore.RED + "ERROR: " + Style.RESET_ALL + f"line: {line_num}, failed to parse example:\n{line}")
                    sys.exit(1)
        else:
            if "```chialisp" in line:
                in_chialisp_block = True

    if in_chialisp_block:
        print(Fore.RED + "ERROR: " + Style.RESET_ALL + f"last chialisp block not closed")
        sys.exit(1)

def check_output(out, expected) -> bool:
    out = out.decode("ascii").strip()
    if out.startswith("FAIL: ") and expected == "FAIL":
        return True
    return out == expected

def run_example(tool, program):
    return subprocess.run([tool, "-n", example], check=False, stdout=subprocess.PIPE).stdout

for example, expected in examples:
    print(f"{example} => {expected} ", end="")
    sys.stdout.flush()
    result = run_example("run", example)
    if not check_output(result, expected):
        brun_result = run_example("brun", example)
        if not check_output(brun_result, expected):
            print(Fore.RED + Style.BRIGHT + "FAILED" + Style.RESET_ALL)
            print(f"result:   {result.decode('ascii').strip()}\nexpected: {expected}")
        else:
            print(Fore.GREEN + "PASS" + Style.RESET_ALL)
    else:
        print(Fore.GREEN + "PASS" + Style.RESET_ALL)
