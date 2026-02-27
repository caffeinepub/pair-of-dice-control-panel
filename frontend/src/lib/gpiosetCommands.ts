/**
 * Converts a decimal code (1-16) to a 4-bit binary string.
 * Examples: 1 -> "0000", 2 -> "0001", 16 -> "1111"
 */
function decimalToBinary(decimal: number): string {
  const binaryValue = decimal - 1;
  return binaryValue.toString(2).padStart(4, '0');
}

/**
 * Generates gpioset commands from a decimal code (1-16).
 * Converts decimal to binary, then maps each bit to GPIO pins (26, 6, 22, 4).
 */
export function generateGpiosetCommands(decimalCode: number): string[] {
  const binary = decimalToBinary(decimalCode);
  const pins = [26, 6, 22, 4];
  
  return pins.map((pin, index) => {
    const state = binary[index];
    return `gpioset -c gpiochip0 ${pin}=${state}`;
  });
}

/**
 * Generates a sequence of gpioset commands as a single string.
 */
export function generateGpiosetCommandSequence(decimalCode: number): string {
  const commands = generateGpiosetCommands(decimalCode);
  return commands.join('\n');
}

/**
 * Generates a single gpioset command for button press/release events.
 * Format: "gpioset -c gpiochip0 <id>=<state>"
 */
export function generateButtonGpiosetCommand(decimalCode: number, state: 0 | 1): string {
  return `gpioset -c gpiochip0 ${decimalCode}=${state}`;
}

/**
 * Generates and executes a gpioset command for any control interaction.
 * Format: "gpioset -c gpiochip0 <controlId>=<value>"
 * @param controlId - The ID of the control
 * @param value - 1 for pressed/active/on, 0 for released/inactive/off
 */
export function executeGpiosetCommand(controlId: string, value: 0 | 1): void {
  const command = `gpioset -c gpiochip0 ${controlId}=${value}`;
  console.log(`[GPIO] ${command}`);
  // In a real implementation, this would execute the command via a backend service
  // For now, we log it to console for verification
}
