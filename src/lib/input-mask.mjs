// The browser bridge supports required digits and phone/identifier separators.
export function validInputMask(mask) {
  return (
    typeof mask === "string" && mask.length <= 64 && /^[0() +./-]*$/.test(mask)
  );
}
export function maskedInput(text, mask) {
  if (!mask) return text;
  const digits = String(text).replace(/[^0-9]/g, "");
  const required = [...mask].filter((c) => c === "0").length;
  let i = 0,
    result = "";
  for (const char of mask) {
    if (char === "0") {
      if (i >= digits.length) break;
      result += digits[i++];
    } else {
      if (i >= digits.length && i < required) break;
      result += char;
    }
  }
  return result;
}
