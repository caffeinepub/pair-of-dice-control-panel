/**
 * Converts a 4-bit binary code into an array of gpioset command strings
 * for Raspberry Pi GPIO control.
 * 
 * Pin mapping (left to right):
 * - bit[0] (leftmost) -> pin 26
 * - bit[1] -> pin 6
 * - bit[2] -> pin 22
 * - bit[3] (rightmost) -> pin 4
 */

const PIN_MAPPING = [26, 6, 22, 4];

export function generateGpiosetCommands(binaryCode: string): string[] {
  if (binaryCode.length !== 4 || !/^[01]{4}$/.test(binaryCode)) {
    throw new Error('Binary code must be exactly 4 characters of 0 or 1');
  }

  const commands: string[] = [];
  
  for (let i = 0; i < 4; i++) {
    const pin = PIN_MAPPING[i];
    const value = binaryCode[i];
    const command = `gpioset-cgpipchip0 ${pin}=${value}`;
    commands.push(command);
  }
  
  return commands;
}

export function generateGpiosetCommandSequence(binaryCode: string): string {
  const commands = generateGpiosetCommands(binaryCode);
  return commands.join('\n');
}
