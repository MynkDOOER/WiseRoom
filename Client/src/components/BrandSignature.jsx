import WiseRoomLogo from "./WiseRoomLogo";
export default function BrandSignature() {
  return (
    <span className="brand-signature" aria-hidden="true">
      <span className="brand-signature-mark">
        <WiseRoomLogo />
      </span>
      <span className="brand-signature-copy">
        <span className="brand-signature-name">
          WiseRoom<span className="signature-dot">.</span>
        </span>
        <span className="brand-signature-caption">A SHARED SPACE</span>
      </span>
    </span>
  );
}
