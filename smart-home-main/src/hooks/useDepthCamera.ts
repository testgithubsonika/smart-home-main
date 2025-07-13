import { useCallback, useState } from "react";

interface DepthDataState {
  depthMap: Uint16Array | null;
  grayscaleMap: Uint8Array | null;
  pseudoDepthMap: number[] | null;
  timestamp: number | null;
  isConnected: boolean;
  error: string | null;
}

export const useDepthCamera = () => {
  const [depthData, setDepthData] = useState<DepthDataState>({
    depthMap: null,
    grayscaleMap: null,
    pseudoDepthMap: null,
    timestamp: null,
    isConnected: false,
    error: null,
  });

  // Convert 16-bit buffer to 8-bit grayscale
  const toGrayscale = (depthBuffer: Uint16Array): Uint8Array => {
    const grayscale = new Uint8Array(depthBuffer.length);
    const maxDepth = Math.max(...depthBuffer);

    for (let i = 0; i < depthBuffer.length; i++) {
      grayscale[i] = Math.min(255, (depthBuffer[i] / maxDepth) * 255);
    }
    return grayscale;
  };

  const connectDepthCamera = useCallback(async () => {
    try {
      const device = await (navigator as Navigator & { usb: { requestDevice: (options: { filters: Array<{ vendorId: number }> }) => Promise<USBDevice> } }).usb.requestDevice({
        filters: [{ vendorId: 0x8086 }], // Adjust for your IR/depth sensor
      });
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      // Custom command to start IR/depth streaming
      await device.controlTransferOut({
        requestType: "vendor",
        recipient: "interface",
        request: 0x01,
        value: 0x0000,
        index: 0x0000,
      });

      const result = await device.transferIn(1, 640 * 480 * 2); // 16-bit
      const depthBuffer = new Uint16Array(result.data!.buffer);
      const grayscaleMap = toGrayscale(depthBuffer);

      setDepthData({
        depthMap: depthBuffer,
        grayscaleMap,
        pseudoDepthMap: null,
        timestamp: Date.now(),
        isConnected: true,
        error: null,
      });
    } catch (err: unknown) {
      console.warn("Falling back to pseudo-depth estimation...");
      estimatePseudoDepth();
    }
  }, []);

  const estimatePseudoDepth = () => {
    // Fallback using heuristic: simulate 3D using landmarks (Z-value)
    // We'll generate dummy pseudo-depth for demo
    const fakeZData = Array.from({ length: 468 }, (_, i) =>
      Math.sin(i / 20) * 50 + 128
    );

    setDepthData({
      depthMap: null,
      grayscaleMap: null,
      pseudoDepthMap: fakeZData,
      timestamp: Date.now(),
      isConnected: false,
      error: "Depth sensor not found. Using pseudo-depth.",
    });
  };

  return {
    ...depthData,
    connectDepthCamera,
  };
};
