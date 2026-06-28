import re
import os

filepath = os.path.join(os.path.dirname(__file__), 'src', 'pages', 'Registration.jsx')

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add useRef
content = content.replace(
    "import { useState, useEffect } from 'react'",
    "import { useState, useEffect, useRef } from 'react'"
)

# 2. Add BottomSheet
bottom_sheet_code = """
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

export default function Registration() {"""
content = content.replace("export default function Registration() {", bottom_sheet_code)

# 3. Add States
states_code = """  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  
  const [reporterPic, setReporterPic] = useState({ file: null, previewUrl: '' })
  const [reporterAadhaar, setReporterAadhaar] = useState({ file: null, previewUrl: '' })
  const [reporterDetailSheet, setReporterDetailSheet] = useState({ file: null, previewUrl: '' })
  const [activeUploadField, setActiveUploadField] = useState(null)
  const uploadInputRef = useRef(null)
  const cameraInputRef = useRef(null)"""
content = re.sub(r"  const \[loading, setLoading\] = useState\(false\)\s*const \[notification, setNotification\] = useState\(null\)", states_code, content)

# 4. Remove reporter_aadhaar_url from formData state
content = re.sub(r"    reporter_phone: '',\s*reporter_aadhaar_url: ''", "    reporter_phone: ''", content)

# 5. Add initial state for editAnimal
edit_animal_code = """      rescuer_type: editAnimal.rescuer_type || '',
      reporter_name: editAnimal.reporter_name || '',
      reporter_address: editAnimal.reporter_address || '',
      reporter_phone: editAnimal.reporter_phone || '',
    })
    
    if (editAnimal.reporter_photo_url) setReporterPic({ file: null, previewUrl: editAnimal.reporter_photo_url })
    if (editAnimal.reporter_aadhaar_url) setReporterAadhaar({ file: null, previewUrl: editAnimal.reporter_aadhaar_url })
    if (editAnimal.reporter_detail_sheet_url) setReporterDetailSheet({ file: null, previewUrl: editAnimal.reporter_detail_sheet_url })
    
    setAnimalId(editAnimal.animal_id || '')"""
content = re.sub(r"      reason_for_admission: editAnimal\.reason_for_admission \|\| '',\s*}\)\s*setAnimalId\(editAnimal\.animal_id \|\| ''\)", "      reason_for_admission: editAnimal.reason_for_admission || '',\n" + edit_animal_code, content)

# 6. Add handleReporterFileSelect
handle_file_select = """
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

  const uploadToCloudinary = async (file) => {"""
content = content.replace("  const uploadToCloudinary = async (file) => {", handle_file_select)

# 7. Update validation in handleSubmit
content = content.replace(
    "if (!formData.reporter_name || !formData.reporter_address || !formData.reporter_phone || !formData.reporter_aadhaar_url)",
    "if (!formData.reporter_name || !formData.reporter_phone)"
)
content = content.replace(
    "throw new Error('All reporter details are required when \"Animal Bought by Reporter\" is selected.')",
    "throw new Error('Name and Phone are required when \"Animal Bought by Reporter\" is selected.')"
)

# 8. Update payload with uploads
upload_logic = """
      let picUrl = reporterPic.previewUrl && !reporterPic.file ? reporterPic.previewUrl : null;
      let aadhaarUrl = reporterAadhaar.previewUrl && !reporterAadhaar.file ? reporterAadhaar.previewUrl : null;
      let detailSheetUrl = reporterDetailSheet.previewUrl && !reporterDetailSheet.file ? reporterDetailSheet.previewUrl : null;

      if (formData.rescuer_type === 'Animal Bought by Reporter') {
        if (reporterPic.file) picUrl = await uploadToCloudinary(reporterPic.file);
        if (reporterAadhaar.file) aadhaarUrl = await uploadToCloudinary(reporterAadhaar.file);
        if (reporterDetailSheet.file) detailSheetUrl = await uploadToCloudinary(reporterDetailSheet.file);
      }
      
      const animalPayload = {"""
content = content.replace("      const animalPayload = {", upload_logic)

content = re.sub(
    r"reporter_aadhaar_url: formData\.rescuer_type === 'Animal Bought by Reporter' \? formData\.reporter_aadhaar_url : null,",
    "reporter_photo_url: picUrl,\n        reporter_aadhaar_url: aadhaarUrl,\n        reporter_detail_sheet_url: detailSheetUrl,",
    content
)

# 9. Extract and move "Rescued / Reporter" form block before "Current Condition"
rescuer_start_idx = content.find("{/* Rescued / Reporter */}")
submit_idx = content.find("{/* Submit Button */}")

if rescuer_start_idx != -1 and submit_idx != -1:
    rescuer_block = content[rescuer_start_idx:submit_idx]
    content = content[:rescuer_start_idx] + content[submit_idx:]
    
    # Replace the aadhaar input inside rescuer_block with the new file uploads
    new_fields_block = """
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>
                Reporter Details
              </label>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Reporter Name *</label>
              <input type="text" name="reporter_name" value={formData.reporter_name} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '1px solid #E0E0E0', borderRadius: '12px', fontSize: '14px' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Reporter Phone *</label>
              <input type="text" name="reporter_phone" value={formData.reporter_phone} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '1px solid #E0E0E0', borderRadius: '12px', fontSize: '14px' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Reporter Address</label>
              <input type="text" name="reporter_address" value={formData.reporter_address} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #E0E0E0', borderRadius: '12px', fontSize: '14px' }} />
            </div>
            
            {/* New Image Upload Fields */}
            {[
              { id: 'pic', label: 'Upload Reporter Pic', state: reporterPic },
              { id: 'aadhaar', label: 'Upload Reporter Aadhaar / ID', state: reporterAadhaar },
              { id: 'sheet', label: 'Upload Reporter Detail Sheet', state: reporterDetailSheet }
            ].map(field => (
              <div key={field.id} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  {field.label}
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setActiveUploadField(field.id)}
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #E0E0E0', backgroundColor: '#F0F0F0', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                  >
                    Select Image
                  </button>
                  {field.state.previewUrl && (
                    <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E0E0E0' }}>
                      <img src={field.state.previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removeReporterFile(field.id)}
                        style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', borderRadius: '0 0 0 4px', width: '16px', height: '16px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
"""
    
    cond_start_idx = rescuer_block.find("{formData.rescuer_type === 'Animal Bought by Reporter' && (")
    if cond_start_idx != -1:
        rescuer_block = rescuer_block[:cond_start_idx] + "{formData.rescuer_type === 'Animal Bought by Reporter' && (\n          <>\n" + new_fields_block
        
    current_cond_idx = content.find("{/* 14. Current Condition */}")
    if current_cond_idx != -1:
        content = content[:current_cond_idx] + rescuer_block + "\n        " + content[current_cond_idx:]

# 10. Add BottomSheet render at the end
modal_code = """
      <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleReporterFileSelect} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleReporterFileSelect} />

      {activeUploadField && (
        <BottomSheet
          title={
            activeUploadField === 'pic' ? 'Upload Reporter Pic' :
            activeUploadField === 'aadhaar' ? 'Upload Reporter Aadhaar / ID' :
            'Upload Reporter Detail Sheet'
          }
          onClose={() => setActiveUploadField(null)}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => { cameraInputRef.current?.click(); setActiveUploadField(null); }}
              style={{ flex: 1, padding: '12px', backgroundColor: '#F0F0F0', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Take Pic
            </button>
            <button
              type="button"
              onClick={() => { uploadInputRef.current?.click(); setActiveUploadField(null); }}
              style={{ flex: 1, padding: '12px', backgroundColor: '#F0F0F0', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Upload Pic
            </button>
          </div>
        </BottomSheet>
      )}
"""

# replace near end of file
content = re.sub(r"</form>\s*</div>\s*\)\s*}", "</form>\n" + modal_code + "\n    </div>\n  )\n}", content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Registration.jsx with Python successfully!")
