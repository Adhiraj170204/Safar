import { Mosaic } from "react-loading-indicators";

type LoadingProps = {
  size?: "small" | "medium" | "large";
  color?: string;
  className?: string;
};

export default function Loading({
  size = "medium",
  color = "currentColor",
  className = "",
}: LoadingProps) {
  return (
    <div
      className={`flex items-center justify-center text-black dark:text-white ${className}`}
    >
      <Mosaic color={color} size={size} text="" textColor="" />
    </div>
  );
}
