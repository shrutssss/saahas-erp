const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Registration.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The Rescuer / Reporter block we want to move is currently between {/* Rescued / Reporter */} and {/* Submit Button */}
// Let's find it.
const rescuerStart = '{/* Rescued / Reporter */}';
const submitStart = '{/* Submit Button */}';

const rescuerStartIndex = content.indexOf(rescuerStart);
const submitStartIndex = content.indexOf(submitStart);

if (rescuerStartIndex > -1 && submitStartIndex > -1) {
    let rescuerBlock = content.substring(rescuerStartIndex, submitStartIndex);
    
    // Remove it from current location
    content = content.substring(0, rescuerStartIndex) + content.substring(submitStartIndex);
    
    // Now replace the Aadhaar URL block inside rescuerBlock with the 3 new fields
    // We will use a shared component or just inline them.
    // To make it easy, we will inline the 3 fields.
    const fieldTemplate = (label, stateField) => `
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>
                ${label} (Optional)
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setActiveUploadField('${stateField}')}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0',
                    backgroundColor: '#F8F8F8',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  {${stateField} === 'pic' ? 'Upload Reporter Pic' : ${stateField} === 'aadhaar' ? 'Upload Aadhaar / ID' : 'Upload Detail Sheet'}
                </button>
              </div>
            </div>`;
            
    // Wait, let's write a better block.
    
    const newFieldsBlock = `
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
`;

    // Replace everything inside {formData.rescuer_type === 'Animal Bought by Reporter' && ( ... )}
    const conditionStart = "{formData.rescuer_type === 'Animal Bought by Reporter' && (";
    const cStartIndex = rescuerBlock.indexOf(conditionStart);
    if (cStartIndex > -1) {
        rescuerBlock = rescuerBlock.substring(0, cStartIndex) + conditionStart + "\n          <>\n" + newFieldsBlock;
    }

    // Now place it before {/* 14. Current Condition */}
    const targetSpot = '{/* 14. Current Condition */}';
    content = content.replace(targetSpot, rescuerBlock + '\n        ' + targetSpot);
}

// Add the shared modal before the final </div> of the component.
// The form ends with </form>, then </div>, then }
const modalCode = `
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
`;

content = content.replace('</form>\n    </div>', '</form>\n' + modalCode + '\n    </div>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Script finalized Registration.jsx updates.');
