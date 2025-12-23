import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';

export default function ImageCropModal({ imageUrl, onComplete, onCancel }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels);
            onComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <>
            <style jsx global>{`
                .reactEasyCrop_Container {
                    position: absolute !important;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                }
                .reactEasyCrop_Image,
                .reactEasyCrop_Video {
                    will-change: transform;
                }
                .reactEasyCrop_CropArea {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    box-sizing: border-box;
                    box-shadow: 0 0 0 9999em rgba(0, 0, 0, 0.5);
                    color: rgba(255, 255, 255, 1);
                    overflow: hidden;
                }
            `}</style>

            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.9)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '15px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#1a1a1a',
                    borderBottom: '1px solid #333'
                }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: 16 }}>Crop Profile Picture</h3>
                    <button
                        onClick={onCancel}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: 8
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Cropper Area */}
                <div style={{ position: 'relative', flex: 1, background: '#000' }}>
                    <Cropper
                        image={imageUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                    />
                </div>

                {/* Controls */}
                <div style={{
                    padding: '20px',
                    background: '#1a1a1a',
                    borderTop: '1px solid #333'
                }}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ color: 'white', fontSize: 13, display: 'block', marginBottom: 8 }}>
                            Zoom
                        </label>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button
                            onClick={onCancel}
                            style={{
                                padding: '10px 20px',
                                background: '#333',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 14
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={createCroppedImage}
                            style={{
                                padding: '10px 20px',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 14,
                                fontWeight: 600
                            }}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// Helper function to create cropped image
const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = 512;
    canvas.width = maxSize;
    canvas.height = maxSize;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        maxSize,
        maxSize
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            resolve(new File([blob], 'profile.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
    });
};

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });
