import React from "react";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import type { PetType } from "../types";

export function FoodBowl({ size, type = "cat" }: { size: number; type?: PetType }) {
  return <Svg width={size} height={size * 0.58} viewBox="0 0 120 70">
    <Path d="M8 23 Q60 4 112 23 L103 56 Q60 76 17 56Z" fill="#C4ACDF" stroke="#6C508F" strokeWidth={3} />
    <Ellipse cx={60} cy={23} rx={52} ry={15} fill="#806092" stroke="#E6D8F2" strokeWidth={4} />
    {[34, 49, 63, 77, 88].map((x, i) => <Circle key={x} cx={x} cy={22 + i % 2 * 3} r={7} fill={type === "rabbit" ? (i % 2 ? "#8BB851" : "#E99A42") : (i % 2 ? "#C9904E" : "#A97039")} />)}
    <Circle cx={60} cy={50} r={6} fill="#8D6AA9" />
    {[48, 56, 65, 73].map((x, i) => <Ellipse key={x} cx={x} cy={39 - (i === 1 || i === 2 ? 3 : 0)} rx={3} ry={4} fill="#8D6AA9" />)}
  </Svg>;
}
