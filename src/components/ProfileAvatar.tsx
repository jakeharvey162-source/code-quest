import { profileAvatar } from "../lib/profile";
export default function ProfileAvatar({ value }: { value: unknown }) {
  const avatar = profileAvatar(value);
  return avatar.startsWith("data:") ? (
    <img src={avatar} alt="" width="48" height="48" />
  ) : (
    <span aria-hidden="true">{avatar}</span>
  );
}
