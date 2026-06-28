const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'AnimalProfile.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetAadhaarBlock = `                    <div>
                      <span style={{ fontSize: '12px', color: '#666' }}>Aadhaar URL:</span>
                      {animal.reporter_aadhaar_url ? (
                        <a href={animal.reporter_aadhaar_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '14px', color: '#2563EB', textDecoration: 'underline' }}>View Aadhaar</a>
                      ) : (
                        <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>—</p>
                      )}
                    </div>`;

const newImagesBlock = `                    <div>
                      <span style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Images:</span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {animal.reporter_photo_url && (
                          <div style={{ textAlign: 'center' }}>
                            <img src={animal.reporter_photo_url} alt="Reporter Pic" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #E0E0E0' }} onClick={() => { setSelectedPhoto(animal.reporter_photo_url); setShowPhotoModal(true); }} />
                            <span style={{ display: 'block', fontSize: '10px', color: '#666', marginTop: '4px' }}>Pic</span>
                          </div>
                        )}
                        {animal.reporter_aadhaar_url && (
                          <div style={{ textAlign: 'center' }}>
                            <img src={animal.reporter_aadhaar_url} alt="Aadhaar" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #E0E0E0' }} onClick={() => { setSelectedPhoto(animal.reporter_aadhaar_url); setShowPhotoModal(true); }} />
                            <span style={{ display: 'block', fontSize: '10px', color: '#666', marginTop: '4px' }}>Aadhaar</span>
                          </div>
                        )}
                        {animal.reporter_detail_sheet_url && (
                          <div style={{ textAlign: 'center' }}>
                            <img src={animal.reporter_detail_sheet_url} alt="Detail Sheet" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #E0E0E0' }} onClick={() => { setSelectedPhoto(animal.reporter_detail_sheet_url); setShowPhotoModal(true); }} />
                            <span style={{ display: 'block', fontSize: '10px', color: '#666', marginTop: '4px' }}>Sheet</span>
                          </div>
                        )}
                        {!animal.reporter_photo_url && !animal.reporter_aadhaar_url && !animal.reporter_detail_sheet_url && (
                          <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>No images uploaded</p>
                        )}
                      </div>
                    </div>`;

content = content.replace(targetAadhaarBlock, newImagesBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated AnimalProfile.jsx');
