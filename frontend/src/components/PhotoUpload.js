import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import API from '../api';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
};

function PhotoUpload({ currentPhoto, userName, onUploadSuccess }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x:0, y:0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);

  const avatarUrl = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'D')}&background=2563eb&color=fff&size=200`;

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => { setImageSrc(reader.result); setShowCropper(true); };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

const uploadCroppedPhoto = async () => {
  setUploading(true);
  try {
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
    const formData = new FormData();
    formData.append('photo', blob, 'photo.jpg');
    console.log('Uploading to:', 'https://medibook-backend-imgg.onrender.com/api/upload');
    const res = await API.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log('Upload response:', res.data);
    const fullUrl = res.data.url;
    onUploadSuccess(fullUrl);
    setShowCropper(false);
    setImageSrc(null);
  } catch (err) {
    console.log('Upload error:', err.response?.data || err.message);
  }
  setUploading(false);
};

  return (
    <div style={s.container}>
      {/* Current Photo */}
      <div style={s.photoWrapper}>
        <img
          src={currentPhoto || avatarUrl(userName)}
          alt={userName}
          style={s.photo}
          onError={e => e.target.src = avatarUrl(userName)}
        />
        <label style={s.changeBtn} htmlFor="photo-upload">
          📷 Change Photo
        </label>
        <input id="photo-upload" type="file" accept="image/*" onChange={onFileChange} style={{display:'none'}} />
      </div>

      {/* Crop Modal */}
      {showCropper && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3 style={{color:'#f1f5f9',margin:'0 0 16px 0'}}>Crop Your Photo</h3>
            <div style={s.cropContainer}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom Slider */}
            <div style={s.sliderRow}>
              <span style={s.sliderLabel}>🔍 Zoom</span>
              <input
                type="range" min={1} max={3} step={0.1}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                style={s.slider}
              />
            </div>

            <div style={s.modalBtns}>
              <button style={s.cancelBtn} onClick={()=>{setShowCropper(false);setImageSrc(null);}}>
                Cancel
              </button>
              <button style={s.saveBtn} onClick={uploadCroppedPhoto} disabled={uploading}>
                {uploading ? 'Uploading...' : '✓ Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container:{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:'20px'},
  photoWrapper:{position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px'},
  photo:{width:'100px',height:'100px',borderRadius:'50%',objectFit:'cover',border:'3px solid #2563eb'},
  changeBtn:{background:'#1e293b',color:'#94a3b8',border:'1px solid #334155',padding:'7px 14px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:'500'},
  modalOverlay:{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'},
  modal:{background:'#0d1117',border:'1px solid #1e293b',borderRadius:'16px',padding:'28px',width:'420px',maxWidth:'90vw'},
  cropContainer:{position:'relative',width:'100%',height:'300px',background:'#000',borderRadius:'12px',overflow:'hidden'},
  sliderRow:{display:'flex',alignItems:'center',gap:'12px',margin:'16px 0'},
  sliderLabel:{color:'#64748b',fontSize:'13px',whiteSpace:'nowrap'},
  slider:{flex:1,accentColor:'#2563eb'},
  modalBtns:{display:'flex',gap:'10px',marginTop:'8px'},
  cancelBtn:{flex:1,padding:'11px',background:'transparent',border:'1px solid #334155',color:'#94a3b8',borderRadius:'8px',cursor:'pointer',fontSize:'14px'},
  saveBtn:{flex:1,padding:'11px',background:'#2563eb',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'14px',fontWeight:'600'},
};

export default PhotoUpload;