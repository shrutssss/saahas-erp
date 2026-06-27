const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Registration.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add useRef
if (!content.includes('useRef')) {
    content = content.replace(
      "import { useState, useEffect } from 'react'",
      "import { useState, useEffect, useRef } from 'react'"
    );
}

// 2. Add BottomSheet
if (!content.includes('function BottomSheet')) {
    const bottomSheetCode = `
const primaryButtonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#F5C800',
  border: 'none',
  borderRadius: '50px',
  fontWeight: 'bold',
  fontSize: '14px',
  cursor: 'pointer',
  color: '#000',
}

function BottomSheet({ title, onClose, children }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: '16px 16px 0 0', padding: '16px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', maxHeight: '85vh', overflowY: 'auto', zIndex: 1001 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{title}</h3>
          <button onClick={onClose} type="button" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </>
  )
}

export default function Registration() {`;
    content = content.replace("export default function Registration() {", bottomSheetCode);
}

// 3. Update formData
content = content.replace("    reporter_phone: '',\r\n    reporter_aadhaar_url: ''\r\n  })", "    reporter_phone: ''\r\n  })");
content = content.replace("    reporter_phone: '',\n    reporter_aadhaar_url: ''\n  })", "    reporter_phone: ''\n  })");

// 4. Add states
if (!content.includes('reporterPic')) {
    const newStates = `
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)

  const [reporterPic, setReporterPic] = useState({ file: null, previewUrl: '' })
  const [reporterAadhaar, setReporterAadhaar] = useState({ file: null, previewUrl: '' })
  const [reporterDetailSheet, setReporterDetailSheet] = useState({ file: null, previewUrl: '' })
  const [activeUploadField, setActiveUploadField] = useState(null)
  const uploadInputRef = useRef(null)
  const cameraInputRef = useRef(null)
`;
    content = content.replace(/  const \[loading, setLoading\] = useState\(false\)[\r\n]+  const \[notification, setNotification\] = useState\(null\)/g, newStates);
}

// 5. Update useEffect for editAnimal
if (!content.includes('setReporterPic({ file: null, previewUrl: editAnimal.reporter_photo_url })')) {
    const editAnimalInitial = `      reason_for_admission: editAnimal.reason_for_admission || '',
      rescuer_type: editAnimal.rescuer_type || '',
      reporter_name: editAnimal.reporter_name || '',
      reporter_address: editAnimal.reporter_address || '',
      reporter_phone: editAnimal.reporter_phone || '',
    })
    if (editAnimal.reporter_photo_url) setReporterPic({ file: null, previewUrl: editAnimal.reporter_photo_url })
    if (editAnimal.reporter_aadhaar_url) setReporterAadhaar({ file: null, previewUrl: editAnimal.reporter_aadhaar_url })
    if (editAnimal.reporter_detail_sheet_url) setReporterDetailSheet({ file: null, previewUrl: editAnimal.reporter_detail_sheet_url })
    setAnimalId(editAnimal.animal_id || '')`;
    
    const r1 = "      reason_for_admission: editAnimal.reason_for_admission || '',\r\n    })\r\n    setAnimalId(editAnimal.animal_id || '')";
    const r2 = "      reason_for_admission: editAnimal.reason_for_admission || '',\n    })\n    setAnimalId(editAnimal.animal_id || '')";
    content = content.replace(r1, editAnimalInitial).replace(r2, editAnimalInitial);
}

// 6. Handle File Select
if (!content.includes('handleReporterFileSelect')) {
    const handleFileSelect = `
  const handleReporterFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const stateObj = { file, previewUrl: event.target.result }
      if (activeUploadField === 'pic') setReporterPic(stateObj)
      if (activeUploadField === 'aadhaar') setReporterAadhaar(stateObj)
      if (activeUploadField === 'sheet') setReporterDetailSheet(stateObj)
      setActiveUploadField(null)
    }
    reader.readAsDataURL(file)
  }

  const removeReporterFile = (field) => {
    if (field === 'pic') setReporterPic({ file: null, previewUrl: '' })
    if (field === 'aadhaar') setReporterAadhaar({ file: null, previewUrl: '' })
    if (field === 'sheet') setReporterDetailSheet({ file: null, previewUrl: '' })
  }
`;
    content = content.replace("  const uploadToCloudinary = async (file) => {", handleFileSelect + "\n  const uploadToCloudinary = async (file) => {");
}

// 7. Update validation in handleSubmit
const val1 = "if (!formData.reporter_name || !formData.reporter_address || !formData.reporter_phone || !formData.reporter_aadhaar_url)";
const val2 = "if (!formData.reporter_name || !formData.reporter_phone)";
content = content.replace(val1, val2);

const err1 = "throw new Error('All reporter details are required when \"Animal Bought by Reporter\" is selected.')";
const err2 = "throw new Error('Name and Phone are required when \"Animal Bought by Reporter\" is selected.')";
content = content.replace(err1, err2);

// 8. Update payload with uploads
const oldPayload = "reporter_aadhaar_url: formData.rescuer_type === 'Animal Bought by Reporter' ? formData.reporter_aadhaar_url : null,";
const payloadUpdate = `reporter_photo_url: picUrl,
        reporter_aadhaar_url: aadhaarUrl,
        reporter_detail_sheet_url: detailSheetUrl,`;
        
if (!content.includes('picUrl = await uploadToCloudinary')) {
    const uploadBeforePayload = `
      let picUrl = reporterPic.previewUrl && !reporterPic.file ? reporterPic.previewUrl : null;
      let aadhaarUrl = reporterAadhaar.previewUrl && !reporterAadhaar.file ? reporterAadhaar.previewUrl : null;
      let detailSheetUrl = reporterDetailSheet.previewUrl && !reporterDetailSheet.file ? reporterDetailSheet.previewUrl : null;

      if (formData.rescuer_type === 'Animal Bought by Reporter') {
        if (reporterPic.file) picUrl = await uploadToCloudinary(reporterPic.file);
        if (reporterAadhaar.file) aadhaarUrl = await uploadToCloudinary(reporterAadhaar.file);
        if (reporterDetailSheet.file) detailSheetUrl = await uploadToCloudinary(reporterDetailSheet.file);
      }
      
      const animalPayload = {`;
      
    content = content.replace("      const animalPayload = {", uploadBeforePayload);
    content = content.replace(oldPayload, payloadUpdate);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Script updated Registration.jsx partly.');
