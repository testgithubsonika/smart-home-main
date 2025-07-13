// components/IDScanner.tsx
//Capture ID front image, extract name, DOB, and photo.
import Tesseract from "tesseract.js";
import { useRef, useState } from "react";

export default function IDScanner({ onScan }: { onScan: (data: any) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [ocrText, setOcrText] = useState("");

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const image = URL.createObjectURL(file);

    const result = await Tesseract.recognize(image, "eng");
    setOcrText(result.data.text);
    onScan(result.data.text);
  };

  return (
    <div className="p-4 border rounded">
      <input type="file" accept="image/*" onChange={handleCapture} ref={fileRef} />
      <pre className="text-sm whitespace-pre-wrap mt-2">{ocrText}</pre>
    </div>
  );
}
