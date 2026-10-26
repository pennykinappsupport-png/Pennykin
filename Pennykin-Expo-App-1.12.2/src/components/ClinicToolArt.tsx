import React from "react";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

export function ClinicToolArt({ kind, size }: { kind: "stethoscope" | "thermometer" | "patch" | "heart"; size: number }) {
  return <Svg width={size} height={size} viewBox="0 0 80 80">
    {kind === "stethoscope" ? <>
      <Path d="M18 12V29Q18 50 37 50Q55 50 55 29V12M37 50V59Q37 72 58 68Q70 65 66 52" stroke="#698A8E" strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M14 10H23M50 10H59" stroke="#C1DDD5" strokeWidth={8} strokeLinecap="round" />
      <Circle cx={64} cy={48} r={10} fill="#C7DFD8" stroke="#668A83" strokeWidth={3} />
      <Circle cx={64} cy={48} r={4} fill="#FBF8EE" />
    </> : kind === "thermometer" ? <>
      <Rect x={31} y={8} width={18} height={51} rx={9} fill="#FFF9EE" stroke="#8AA7B7" strokeWidth={3} />
      <Circle cx={40} cy={61} r={12} fill="#FFF9EE" stroke="#8AA7B7" strokeWidth={3} />
      <Path d="M40 26V61" stroke="#D69496" strokeWidth={5} strokeLinecap="round" />
      <Circle cx={40} cy={61} r={6} fill="#D69496" />
      <Path d="M44 23H48M44 32H48M44 41H48" stroke="#8AA7B7" strokeWidth={2} />
    </> : kind === "patch" ? <>
      <Rect x={8} y={24} width={64} height={32} rx={12} fill="#F3D3B2" stroke="#C79D80" strokeWidth={2} />
      <Rect x={29} y={26} width={22} height={28} rx={5} fill="#FFEADD" />
      <Path d="M40 46C26 37 35 30 40 35C46 29 54 37 40 46" fill="#D698AA" />
      {[16, 23, 57, 64].map((x) => <React.Fragment key={x}><Circle cx={x} cy={34} r={1.2} fill="#CDA488" /><Circle cx={x} cy={45} r={1.2} fill="#CDA488" /></React.Fragment>)}
    </> : <>
      <Path d="M40 66C-2 40 12 9 40 27C68 9 82 40 40 66" fill="#E2A8BC" stroke="#B67898" strokeWidth={2} />
      <Ellipse cx={25} cy={28} rx={5} ry={3} fill="#FFEFF5" />
    </>}
  </Svg>;
}

export function ClinicSetArt() {
  return <Svg width="100%" height="100%" viewBox="0 0 360 200" preserveAspectRatio="xMidYMax meet">
    <Path d="M9 130Q180 87 351 130V200H9Z" fill="#DBE9E1" opacity={0.62} />
    <Rect x={15} y={64} width={57} height={101} rx={12} fill="#F7F0E3" stroke="#A6BFB6" strokeWidth={2} />
    <Rect x={12} y={56} width={63} height={13} rx={5} fill="#B5CDC2" />
    <Path d="M20 119H66M39 135H47" stroke="#B6C8C0" strokeWidth={3} strokeLinecap="round" />
    <Rect x={26} y={81} width={35} height={24} rx={5} fill="#C8DDD2" />
    <Path d="M39 87V99M33 93H45" stroke="#FFF9F0" strokeWidth={4} strokeLinecap="round" />
    <Rect x={280} y={66} width={54} height={38} rx={9} fill="#DCCEE9" stroke="#A69AB8" strokeWidth={2} />
    <Path d="M293 68V59H320V68M307 77V94M299 85H315" stroke="#FAF5FF" strokeWidth={4} fill="none" strokeLinecap="round" />
    <Path d="M281 107H334M287 110V166M328 110V166" stroke="#B99A7A" strokeWidth={5} strokeLinecap="round" />
    <Ellipse cx={180} cy={172} rx={106} ry={25} fill="#ADCABC" />
    <Ellipse cx={180} cy={166} rx={106} ry={25} fill="#F8F2E6" stroke="#B7D2C6" strokeWidth={4} />
    <Ellipse cx={180} cy={163} rx={92} ry={17} fill="#D6E5DB" />
    <Path d="M153 163Q181 153 206 163" stroke="#F5FCF4" strokeWidth={3} fill="none" strokeLinecap="round" />
  </Svg>;
}
