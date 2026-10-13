export const avatars = ["🤖", "🦁", "🚀", "🧑🏾‍💻", "🦉", "🐉"];
export function validAvatar(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (avatars.includes(value) ||
      value === "" ||
      (value.length <= 24000 &&
        /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value)))
  );
}
export function profileAvatar(value: unknown): string {
  return validAvatar(value) && value ? value : "🤖";
}
export async function readProfilePhoto(file: File): Promise<string> {
  if (!/^(image\/(jpeg|png|webp))$/.test(file.type) || file.size > 5_000_000)
    throw Error("Choose a JPG, PNG or WebP photo under 5 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 96;
    const context = canvas.getContext("2d");
    if (!context) throw Error("Photo uploads are unavailable in this browser.");
    const side = Math.min(image.width, image.height);
    context.drawImage(
      image,
      (image.width - side) / 2,
      (image.height - side) / 2,
      side,
      side,
      0,
      0,
      96,
      96,
    );
    const photo = canvas.toDataURL("image/jpeg", 0.75);
    if (!validAvatar(photo))
      throw Error("This photo could not be resized. Try another image.");
    return photo;
  } finally {
    URL.revokeObjectURL(url);
  }
}
