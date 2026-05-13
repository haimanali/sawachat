import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

// Utility function to crop image
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();

        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));

        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: any
): Promise<{ base64: string }> {

    const image = await createImage(imageSrc);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return {
            base64: "",
        };
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    const getBase64Size = (base64: string) => {

        const data = base64.split(',')[1] || '';

        return Math.ceil((data.length * 3) / 4);
    };

    let type = "image/jpeg";
    let fullBase64 = canvas.toDataURL(type, 0.9);

    // compress jpeg if larger than 1MB
    if (getBase64Size(fullBase64) > 1024 * 1024) {
        fullBase64 = canvas.toDataURL(type, 0.7);
    }

    // fallback to png
    if (getBase64Size(fullBase64) > 1024 * 1024) {

        type = "image/png";

        fullBase64 = canvas.toDataURL(type);
    }

    // final validation
    if (
        type !== "image/jpeg" &&
        type !== "image/png"
    ) {
        throw new Error("Only PNG and JPEG are allowed");
    }

    if (getBase64Size(fullBase64) > 1024 * 1024) {
        throw new Error("Image must be 1MB or less");
    }

    return {base64 : fullBase64};
}

import { useApp } from '../../hooks/useApp';

export default function ImageCropperPOPUP({
    image,
    onCropComplete,
    onClose,
    aspect = 1
}: {
    image: string,
    onCropComplete: (base64: string) => void,
    onClose: () => void,
    aspect?: number
}) {

    const { t } = useApp();

    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropCompleteHandler = useCallback(
        (_croppedArea: any, croppedAreaPixels: any) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const showCroppedImage = useCallback(async () => {

        try {

            const croppedImage = await getCroppedImg(
                image,
                croppedAreaPixels
            );

            onCropComplete(
                croppedImage.base64,
            );

        } catch (e) {
            console.error(e);
        }

    }, [croppedAreaPixels, image, onCropComplete]);

    return (
        <div
            className="modal-overlay active"
            style={{ zIndex: 1000 }}
        >

            <div
                className="modal"
                style={{
                    width: "500px",
                    height: "600px",
                    display: "flex",
                    flexDirection: "column",
                    padding: "24px"
                }}
            >

                <h2
                    style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        marginBottom: "16px"
                    }}
                >
                    {t('edit_photo') || 'Edit Photo'}
                </h2>

                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        flex: 1,
                        background: "#1a1a2e",
                        borderRadius: "8px",
                        overflow: "hidden"
                    }}
                >

                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={setZoom}
                    />

                </div>

                <div
                    style={{
                        padding: "24px 0 8px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px"
                    }}
                >

                    <span style={{ fontWeight: 600 }}>
                        {t('zoom') || 'Zoom'}
                    </span>

                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) =>
                            setZoom(Number(e.target.value))
                        }
                        style={{
                            flex: 1,
                            cursor: "pointer"
                        }}
                    />

                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "16px",
                        marginTop: "16px"
                    }}
                >

                    <button
                        className="btn secondary"
                        onClick={onClose}
                        style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                            padding: "10px 24px",
                            borderRadius: "24px",
                            cursor: "pointer"
                        }}
                    >
                        {t('cancel') || 'Cancel'}
                    </button>

                    <button
                        className="btn primary"
                        onClick={showCroppedImage}
                        style={{
                            background: "var(--primary)",
                            color: "white",
                            padding: "10px 24px",
                            borderRadius: "24px",
                            cursor: "pointer",
                            border: "none"
                        }}
                    >
                        {t('confirm') || 'Confirm'}
                    </button>

                </div>

            </div>

        </div>
    );
}