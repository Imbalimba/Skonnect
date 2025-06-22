import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaFilePdf } from 'react-icons/fa';

// Import the logo images
import defaultLogo from '../../assets/logo.png';
import delapazLogo from '../../assets/delapaz_logo.png';
import manggahanLogo from '../../assets/manggahan_logo.png';
import maybungaLogo from '../../assets/maybunga_logo.png';
import pinagbuhatanLogo from '../../assets/pinagbuhatan_logo.png';
import santolanLogo from '../../assets/santolan_logo.png';
import rosarioLogo from  '../../assets/rosario_logo.png';
import sanmiguelLogo from '../../assets/sanmiguel_logo.png';
import staLuciaLogo from '../../assets/sta lucia_logo.png';


const YouthProfilePdfExport = ({ profile, buttonType = 'standard' }) => {
  // Create a map of barangay names to logo image paths
  const barangayLogos = {
    delapaz: delapazLogo,
    manggahan: manggahanLogo,
    maybunga: maybungaLogo,
    pinagbuhatan: pinagbuhatanLogo,
    santolan: santolanLogo,
    stalucia: staLuciaLogo,
    rosario: rosarioLogo,
    sanmiguel: sanmiguelLogo,
    santalucia: staLuciaLogo,
    default: defaultLogo
  };

  // Function to get the appropriate logo based on barangay
  const getBarangayLogo = (barangay) => {
    if (!barangay) return barangayLogos.default;
    
    // Normalize the barangay name for matching
    const normalizedBarangay = barangay.toLowerCase().replace(/\s+/g, '');
    
    // Check for specific barangay matches
    if (normalizedBarangay.includes('delapaz')) return barangayLogos.delapaz;
    if (normalizedBarangay.includes('manggahan')) return barangayLogos.manggahan;
    if (normalizedBarangay.includes('maybunga')) return barangayLogos.maybunga;
    if (normalizedBarangay.includes('pinagbuhatan')) return barangayLogos.pinagbuhatan;
    if (normalizedBarangay.includes('santolan')) return barangayLogos.santolan;
    if (normalizedBarangay.includes('rosario')) return barangayLogos.rosario;
    if (normalizedBarangay.includes('sanmiguel')) return barangayLogos.sanmiguel;
    if (normalizedBarangay.includes('stalucia') || normalizedBarangay.includes('santalucia')) 
      return barangayLogos.stalucia;
    
    // Return default logo if no match
    return barangayLogos.default;
  };

  const handleExport = (e) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Create a temporary hidden div to render the form
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.className = 'youth-profile-form';
    document.body.appendChild(tempDiv);
    
    // Format date for form display
    const formatDate = (dateString) => {
      if (!dateString) return ['', '', ''];
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      return [month, day, year];
    };
    
    const birthDateParts = formatDate(profile.birthdate);
    
    // Map educational background values to form labels
    const educationMap = {
      'Elementary Level': 'ELEM. LEVEL',
      'Elementary Grad': 'ELEM. GRAD',
      'High School Level': 'HS LEVEL',
      'High School Grad': 'HS GRAD',
      'Vocational Grad': 'VOCATIONAL GRAD',
      'College Level': 'COLLEGE LEVEL',
      'College Grad': 'COLLEGE GRAD',
      'Masters Level': 'MASTERS LEVEL',
      'Masters Grad': 'MASTERS GRAD',
      'Doctorate Level': 'DOCTORATE LEVEL',
      'Doctorate Grad': 'DOCTORATE GRAD'
    };

    // Map civil status values
    const civilStatusMap = {
      'Single': 'SINGLE',
      'Married': 'MARRIED',
      'Widowed': 'WIDOWED',
      'Divorced': 'DIVORCED',
      'Separated': 'SEPARATED',
      'Annulled': 'ANNULLED',
      'Live-in': 'LIVE-IN',
      'Unknown': 'UNKNOWN'
    };
    
    // Map work status values
    const workStatusMap = {
      'Employed': 'EMPLOYED',
      'Unemployed': 'UNEMPLOYED',
      'Self Employed': 'SELF EMPLOYED',
      'Currently Looking For a Job': 'CURRENTLY LOOKING FOR A JOB',
      'Not Interested Looking For a Job': 'NOT INTERESTED IN LOOKING FOR A JOB'
    };
    
    // Map youth age group values
    const youthAgeGroupMap = {
      'Child Youth(15-17 yrs old)': 'CHILD YOUTH (15-17 YO)',
      'Core Youth(18-24 yrs old)': 'CORE YOUTH (18-24 YO)',
      'Young Adult(25-30 yrs old)': 'YOUNG ADULT (25-30 YO)'
    };
    
    // Use the barangay from profile or default to a placeholder
    const barangayName = profile.barangay || 'BARANGAY';
    
    // Parse the oosy ranking if it exists
    let osyRanking = null;
    if (profile.osyranking) {
      try {
        osyRanking = JSON.parse(profile.osyranking);
      } catch (e) {
        console.error('Failed to parse OSY ranking', e);
      }
    }

    // Get the appropriate logo for this profile's barangay
    const logoImg = getBarangayLogo(profile.barangay);

    // Create an image element with the logo
    const logoImgElement = document.createElement('img');
    logoImgElement.src = logoImg;
    logoImgElement.style.width = '70px';
    logoImgElement.style.height = '70px';
    logoImgElement.style.borderRadius = '50%';
    logoImgElement.style.marginRight = '15px';

    // First page content
    tempDiv.innerHTML = `
    <div class="pdf-container" style="width: 794px; height: 1123px; padding: 15px; font-family: Arial, sans-serif; position: relative; background-color: white; font-size: 11px;">
      <!-- Header with logo on left and control number on right -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <div style="display: flex; align-items: center;">
          <div style="display: inline-block; width: 70px; height: 70px; border-radius: 50%; overflow: hidden; margin-right: 15px;" id="logo-container">
            <!-- Barangay Logo will be inserted here -->
          </div>
          <div>
            <h1 style="font-size: 14px; font-weight: bold; margin: 3px 0;">SANGGUNIANG KABATAAN NG ${barangayName.toUpperCase()}</h1>
            <h2 style="font-size: 12px; font-weight: bold; margin: 3px 0;">YOUTH PROFILING 2025</h2>
          </div>
        </div>
        
        <!-- Control Number on right side -->
        <div style="text-align: right; border: 1px solid #000; padding: 3px; min-width: 200px;">
          <span style="font-weight: bold;">CONTROL NO.</span>
          <span>SK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}</span>
        </div>
      </div>
        
      <!-- Data Privacy Consent - Made more compact -->
      <div style="border: 1px solid #000; padding: 8px; margin-bottom: 10px; font-size: 8px;">
        <p style="font-weight: bold; margin: 0 0 2px 0;">Data Privacy Consent</p>
        <p style="margin: 0 0 2px 0;">
          The Sangguniang Kabataan ng ${barangayName} is conducting a Youth Profiling for 2025, collecting personal information, 
          educational background, socioeconomic details, and interests for community development and tailored youth programs.
        </p>
        <p style="margin: 0 0 2px 0;">
          All collected data will be treated confidentially, accessible only to authorized personnel, and retained for the profiling 
          period, adhering to applicable laws. Participation is voluntary, and by engaging, individuals consent to data use for planning 
          and communication purposes.
        </p>
        <p style="margin: 0 0 2px 0;">
          Any concerns or queries about information handling can be directed to the Sangguniang Kabataan ng ${barangayName}.
        </p>
        <p style="margin: 0;">
          Participants acknowledge their understanding and consent by engaging in the profiling.
        </p>
      </div>
          
      <!-- Basic Information Section - Reduced vertical spacing -->
      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 2px; font-size: 12px;">
          I. BASIC INFORMATION
        </div>
        
        <!-- First Name -->
        <div style="margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">FIRST NAME:</div>
          <div style="display: flex; border: 1px solid #000;">
            ${Array.from({ length: 16 }).map((_, i) => `
              <div style="width: 22px; height: 20px; border-right: ${i < 15 ? '1px solid #000' : 'none'}; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                ${profile.first_name && i < profile.first_name.length ? profile.first_name[i] : ''}
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Middle Name -->
        <div style="margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">MIDDLE NAME:</div>
          <div style="display: flex; border: 1px solid #000;">
            ${Array.from({ length: 16 }).map((_, i) => `
              <div style="width: 22px; height: 20px; border-right: ${i < 15 ? '1px solid #000' : 'none'}; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                ${profile.middle_name && i < profile.middle_name.length ? profile.middle_name[i] : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Last Name -->
        <div style="margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">LAST NAME:</div>
          <div style="display: flex; border: 1px solid #000;">
            ${Array.from({ length: 16 }).map((_, i) => `
              <div style="width: 22px; height: 20px; border-right: ${i < 15 ? '1px solid #000' : 'none'}; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                ${profile.last_name && i < profile.last_name.length ? profile.last_name[i] : ''}
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Sex and Birthday - More compact layout -->
        <div style="display: flex; margin-bottom: 5px;">
          <div style="margin-right: 20px; flex: 1;">
            <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">SEX ASSIGNED AT BIRTH:</div>
            <div style="display: flex; align-items: center;">
              <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.gender === 'Male' ? '#000' : '#fff'};"></div>
              <span style="margin-right: 10px; font-size: 10px;">MALE</span>
              <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.gender === 'Female' ? '#000' : '#fff'};"></div>
              <span style="font-size: 10px;">FEMALE</span>
            </div>
          </div>
          
          <div style="flex: 1;">
            <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">BIRTHDAY (MM/DD/YY):</div>
            <div style="display: flex;">
              <div style="display: flex;">
                <div style="width: 18px; height: 18px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 10px;">${birthDateParts[0][0] || ''}</div>
                <div style="width: 18px; height: 18px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 10px;">${birthDateParts[0][1] || ''}</div>
              </div>
              <span style="margin: 0 2px;">/</span>
              <div style="display: flex;">
                <div style="width: 18px; height: 18px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 10px;">${birthDateParts[1][0] || ''}</div>
                <div style="width: 18px; height: 18px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 10px;">${birthDateParts[1][1] || ''}</div>
              </div>
              <span style="margin: 0 2px;">/</span>
              <div style="display: flex;">
                <div style="width: 18px; height: 18px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 10px;">${birthDateParts[2][0] || ''}</div>
                <div style="width: 18px; height: 18px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 10px;">${birthDateParts[2][1] || ''}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Age and Email -->
        <div style="display: flex; margin-bottom: 5px;">
          <div style="margin-right: 15px; width: 70px;">
            <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">AGE:</div>
            <div style="display: flex; border: 1px solid #000;">
              ${profile.age ? profile.age.toString().split('').map(digit => `
                <div style="width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                  ${digit}
                </div>
              `).join('') : ''}
            </div>
          </div>
          
          <div style="flex-grow: 1;">
            <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">EMAIL ADDRESS:</div>
            <div style="border: 1px solid #000; height: 18px; padding: 1px 5px; overflow: hidden; font-size: 10px;">
              ${profile.email || ''}
            </div>
          </div>
        </div>
        
        <!-- Address -->
        <div style="margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">ADDRESS:</div>
          <div style="border: 1px solid #000; height: 18px; padding: 1px 5px; overflow: hidden; font-size: 10px;">
            ${profile.address || ''}
          </div>
        </div>
        
        <!-- Contact Number -->
        <div style="margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">CONTACT NUMBER:</div>
          <div style="display: flex;">
            <!-- Fixed 09 prefix -->
            <div style="width: 18px; height: 18px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 10px;">0</div>
            <div style="width: 18px; height: 18px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 10px;">9</div>
            
            <!-- Remaining digits -->
            ${Array.from({ length: 9 }).map((_, i) => {
              const phoneDigit = profile.phone_number && profile.phone_number.length > i + 2 ? profile.phone_number[i + 2] : '';
              return `
                <div style="width: 18px; height: 18px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                  ${phoneDigit}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Demographics Section - Reduced spacing -->
      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 2px; font-size: 12px;">
          II. DEMOGRAPHICS CLASSIFICATION
        </div>
        
        <!-- Civil Status - More compact layout -->
        <div style="margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">CIVIL STATUS:</div>
          <div style="display: flex; flex-wrap: wrap;">
            ${['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED', 'SEPARATED', 'ANNULLED', 'LIVE-IN', 'UNKNOWN'].map(status => {
              const isChecked = profile.civil_status && civilStatusMap[profile.civil_status] === status;
              return `
                <div style="display: flex; align-items: center; margin-right: 10px; margin-bottom: 3px;">
                  <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${isChecked ? '#000' : '#fff'};"></div>
                  <span style="font-size: 10px;">${status}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <!-- Youth Classification -->
        <div style="margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">YOUTH CLASSIFICATION</div>
          <div style="display: flex; flex-wrap: wrap;">
            ${[
              { label: 'IN SCHOOL YOUTH', value: 'In School Youth' },
              { label: 'OUT OF SCHOOL YOUTH', value: 'Out of School Youth' },
              { label: 'WORKING YOUTH', value: 'Working Youth' }
            ].map(classification => {
              const isChecked = profile.youth_classification === classification.value;
              return `
                <div style="display: flex; align-items: center; margin-right: 10px; margin-bottom: 3px;">
                  <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${isChecked ? '#000' : '#fff'};"></div>
                  <span style="font-size: 10px;">${classification.label}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Youth with Specific Needs -->
        <div style="margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">YOUTH WITH SPECIFIC NEEDS</div>
          <div style="display: flex; flex-wrap: wrap;">
            ${[
              { label: 'PERSON W/ DISABILITY', checked: profile.youth_classification && profile.youth_classification.includes('Person w/ Disability') },
              { label: 'CHILDREN IN CONFLICT WITH LAW', checked: profile.youth_classification && profile.youth_classification.includes('Children in Conflic w/ Law') },
              { label: 'INDIGENOUS PEOPLE', checked: profile.youth_classification && profile.youth_classification.includes('Indigenous People') },
              { label: 'PERSON W/ POOR VISION', checked: false }
            ].map(item => `
              <div style="display: flex; align-items: center; margin-right: 10px; margin-bottom: 3px;">
                <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${item.checked ? '#000' : '#fff'};"></div>
                <span style="font-size: 10px;">${item.label}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Youth Age Group -->
        <div style="margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">YOUTH AGE GROUP:</div>
          <div style="display: flex; flex-wrap: wrap;">
            ${Object.entries(youthAgeGroupMap).map(([value, label]) => {
              const isChecked = profile.youth_age_group === value;
              return `
                <div style="display: flex; align-items: center; margin-right: 10px; margin-bottom: 3px;">
                  <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${isChecked ? '#000' : '#fff'};"></div>
                  <span style="font-size: 10px;">${label}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <!-- Educational Background -->
        <div style="margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">EDUCATIONAL BACKGROUND:</div>
          <div style="display: flex; flex-wrap: wrap;">
            ${Object.entries(educationMap).map(([value, label], index) => {
              const isChecked = profile.educational_background === value;
              // Creating two rows for better layout
              return `
                <div style="display: flex; align-items: center; margin-right: 5px; margin-bottom: 3px; width: ${index < 6 ? '16%' : '20%'};">
                  <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${isChecked ? '#000' : '#fff'};"></div>
                  <span style="font-size: 9px;">${label}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Work Status Section -->
      <div>
        <!-- Work Status - More compact layout -->
        <div style="margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">WORK STATUS:</div>
          <div style="display: flex; flex-wrap: wrap;">
            ${Object.entries(workStatusMap).map(([value, label], index) => {
              const isChecked = profile.work_status === value;
              return `
                <div style="display: flex; align-items: center; margin-right: 5px; margin-bottom: 3px; width: ${index < 2 ? '20%' : '40%'};">
                  <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${isChecked ? '#000' : '#fff'};"></div>
                  <span style="font-size: 9px;">${label}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <!-- Voter Registration - Side by side layout -->
        <div style="display: flex; margin-bottom: 5px;">
          <div style="margin-right: 20px; flex: 1;">
            <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">REGISTERED SK VOTER?</div>
            <div style="display: flex; align-items: center;">
              <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.sk_voter === 'Yes' ? '#000' : '#fff'};"></div>
              <span style="margin-right: 10px; font-size: 10px;">YES</span>
              <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.sk_voter === 'No' ? '#000' : '#fff'};"></div>
              <span style="font-size: 10px;">NO</span>
            </div>
          </div>
          
          <div style="flex: 1;">
            <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">REGISTERED NATIONAL VOTER?</div>
            <div style="display: flex; align-items: center;">
              <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.national_voter === 'Yes' ? '#000' : '#fff'};"></div>
              <span style="margin-right: 10px; font-size: 10px;">YES</span>
              <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.national_voter === 'No' ? '#000' : '#fff'};"></div>
              <span style="font-size: 10px;">NO</span>
            </div>
          </div>
        </div>

        <!-- SK Election Participation -->
        <div style="margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">DID YOU VOTE LAST SK ELECTIONS?</div>
          <div style="display: flex; align-items: center;">
            <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.did_vote_last_election === 'Yes' ? '#000' : '#fff'};"></div>
            <span style="margin-right: 20px; font-size: 10px;">YES</span>
            <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.did_vote_last_election === 'No' ? '#000' : '#fff'};"></div>
            <span style="font-size: 10px;">NO</span>
          </div>
        </div>
        
        <!-- KK Assembly Attendance -->
        <div style="margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">HAVE YOU ATTENDED A KATIPUNAN NG KABATAAN (KK) ASSEMBLY?</div>
          <div style="display: flex; align-items: center;">
            <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.kk_assembly_attendance === 'Yes' ? '#000' : '#fff'};"></div>
            <span style="margin-right: 20px; font-size: 10px;">YES</span>
            <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.kk_assembly_attendance === 'No' ? '#000' : '#fff'};"></div>
            <span style="font-size: 10px;">NO</span>
          </div>
        </div>
        
        <!-- Always show both conditional sections -->
        <div style="margin-left: 10px; margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">IF YES, HOW MANY TIMES?</div>
          <div style="display: flex; align-items: center;">
            ${[
              { label: '1-2 TIMES', value: '1-2 Times' },
              { label: '3-4 TIMES', value: '3-4 Times' },
              { label: '5 AND ABOVE', value: '5 and above' }
            ].map(option => {
              const isChecked = profile.kk_assembly_attendance === 'Yes' && profile.kk_assembly_attendance_times === option.value;
              return `
                <div style="display: flex; align-items: center; margin-right: 10px;">
                  <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${isChecked ? '#000' : '#fff'};"></div>
                  <span style="font-size: 10px;">${option.label}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <div style="margin-left: 10px; margin-bottom: 5px;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">IF NO, WHY?</div>
          <div style="display: flex; flex-wrap: wrap;">
            ${[
              { label: 'THERE WAS NO KK ASSEMBLY MEETING', value: 'There was no KK Assembly Meeting' },
              { label: 'NOT AWARE OR INFORMED', value: '' },
              { label: 'NOT INTERESTED', value: 'Not Interested to Attend' }
            ].map(reason => {
              const isChecked = profile.kk_assembly_attendance === 'No' && profile.reason_for_not_attending === reason.value;
              return `
                <div style="display: flex; align-items: center; margin-right: 10px; margin-bottom: 3px;">
                  <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${isChecked ? '#000' : '#fff'};"></div>
                  <span style="font-size: 10px;">${reason.label}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>`;

    // Second page content - Add the additional questions
    const secondPageDiv = document.createElement('div');
    secondPageDiv.style.width = '794px';
    secondPageDiv.style.height = '1123px';
    secondPageDiv.style.padding = '15px';
    secondPageDiv.style.fontFamily = 'Arial, sans-serif';
    secondPageDiv.style.position = 'relative';
    secondPageDiv.style.backgroundColor = 'white';
    secondPageDiv.style.fontSize = '11px';
    secondPageDiv.innerHTML = `
    <div style="margin-bottom: 10px;">
      <div style="font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 2px; font-size: 12px;">
        ADDITIONAL QUESTIONS
      </div>

      <!-- Solo Parent -->
      <div style="margin-bottom: 5px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">ARE YOU A SOLO PARENT?</div>
        <div style="display: flex; align-items: center;">
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.soloparent === 'Yes' ? '#000' : '#fff'};"></div>
          <span style="margin-right: 20px; font-size: 10px;">YES</span>
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.soloparent === 'No' ? '#000' : '#fff'};"></div>
          <span style="font-size: 10px;">NO</span>
          
          <span style="margin-left: 20px; font-size: 10px; font-weight: bold;">IF YES, INDICATE NO. OF CHILD/REN:</span>
          <div style="display: inline-block; width: 25px; height: 18px; border: 1px solid #000; margin-left: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px;">
            ${profile.soloparent === 'Yes' ? (profile.num_of_children || '') : ''}
          </div>
        </div>
      </div>

      <!-- PWD -->
      <div style="margin-bottom: 5px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">ARE YOU A PWD?</div>
        <div style="display: flex; align-items: center;">
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.pwd === 'Yes' ? '#000' : '#fff'};"></div>
          <span style="margin-right: 20px; font-size: 10px;">YES</span>
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.pwd === 'No' ? '#000' : '#fff'};"></div>
          <span style="font-size: 10px;">NO</span>
          
          <span style="margin-left: 20px; font-size: 10px; font-weight: bold;">IF YES, FOR HOW LONG? INDICATE NO. OF YRS.</span>
          <div style="display: inline-block; width: 25px; height: 18px; border: 1px solid #000; margin-left: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px;">
            ${profile.pwd === 'Yes' ? (profile.pwd_years || '') : ''}
          </div>
        </div>
      </div>

      <!-- Athlete -->
      <div style="margin-bottom: 5px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">ARE YOU AN ATHLETE?</div>
        <div style="display: flex; align-items: center;">
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.athlete === 'Yes' ? '#000' : '#fff'};"></div>
          <span style="margin-right: 20px; font-size: 10px;">YES</span>
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.athlete === 'No' ? '#000' : '#fff'};"></div>
          <span style="font-size: 10px;">NO</span>
          
          <span style="margin-left: 20px; font-size: 10px; font-weight: bold;">IF YES, INDICATE SPORTS.</span>
          <div style="display: inline-block; min-width: 100px; height: 18px; border: 1px solid #000; margin-left: 5px; padding: 0 5px; display: flex; align-items: center; font-size: 10px;">
            ${profile.athlete === 'Yes' ? (profile.sport_name || '') : ''}
          </div>
        </div>
      </div>

      <!-- Scholar -->
      <div style="margin-bottom: 5px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">ARE YOU A SCHOLAR?</div>
        <div style="display: flex; align-items: center;">
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.scholar === 'Yes' ? '#000' : '#fff'};"></div>
          <span style="margin-right: 20px; font-size: 10px;">YES</span>
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.scholar === 'No' ? '#000' : '#fff'};"></div>
          <span style="font-size: 10px;">NO</span>
        </div>
      </div>

      <!-- Pasig Scholar - Always show -->
      <div style="margin-bottom: 5px; margin-left: 20px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">ARE YOU A PASIG CITY SCHOLAR?</div>
        <div style="display: flex; align-items: center;">
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.scholar === 'Yes' && profile.pasigscholar === 'Yes' ? '#000' : '#fff'};"></div>
          <span style="margin-right: 20px; font-size: 10px;">YES</span>
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.scholar === 'Yes' && profile.pasigscholar === 'No' ? '#000' : '#fff'};"></div>
          <span style="font-size: 10px;">NO</span>
        </div>
      </div>

      <!-- Other Scholarship - Always show -->
      <div style="margin-bottom: 5px; margin-left: 20px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">IF SCHOLAR OTHER THAN PCS, INDICATE NAME OF SCHOLARSHIP PROGRAM.</div>
        <div style="border: 1px solid #000; min-height: 18px; padding: 1px 5px; font-size: 10px;">
          ${profile.scholar === 'Yes' && profile.pasigscholar === 'No' ? (profile.scholarship_name || '') : ''}
        </div>
      </div>

      <!-- Education Level -->
      <div style="margin-bottom: 5px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">IF CURRENTLY STUDYING, INDICATE LEVEL.</div>
        <div style="display: flex; flex-wrap: wrap;">
          ${[
            { label: 'SECONDARY', value: 'Secondary' },
            { label: 'TERTIARY', value: 'Tertiary' },
            { label: 'GRADUATE LEVEL', value: 'Graduate Level' }
          ].map(level => {
            const isChecked = profile.studying_level === level.value;
            return `
              <div style="display: flex; align-items: center; margin-right: 15px; margin-bottom: 3px;">
                <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${isChecked ? '#000' : '#fff'};"></div>
                <span style="font-size: 10px;">${level.label}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Year Level and School - Always show regardless of studying status -->
      <div style="display: flex; margin-bottom: 5px; margin-left: 20px;">
        <div style="margin-right: 15px; flex: 1;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">YEAR LEVEL:</div>
          <div style="border: 1px solid #000; height: 18px; padding: 1px 5px; font-size: 10px;">
            ${profile.studying_level && profile.studying_level !== 'Not Studying' ? (profile.yearlevel || '') : ''}
          </div>
        </div>
        
        <div style="flex: 3;">
          <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">SCHOOL:</div>
          <div style="border: 1px solid #000; height: 18px; padding: 1px 5px; font-size: 10px;">
            ${profile.studying_level && profile.studying_level !== 'Not Studying' ? (profile.school_name || '') : ''}
          </div>
        </div>
      </div>

      <!-- Working Status -->
      <div style="margin-bottom: 5px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">CURRENTLY WORKING?</div>
        <div style="display: flex; align-items: center;">
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.working_status === 'Yes' ? '#000' : '#fff'};"></div>
          <span style="margin-right: 20px; font-size: 10px;">YES</span>
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.working_status === 'No' ? '#000' : '#fff'};"></div>
          <span style="font-size: 10px;">NO</span>
        </div>
      </div>

      <!-- Company and Position - Always show even if not working -->
      <div style="margin-bottom: 5px; margin-left: 20px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">NAME OF COMPANY:</div>
        <div style="border: 1px solid #000; height: 18px; padding: 1px 5px; font-size: 10px;">
          ${profile.working_status === 'Yes' ? (profile.company_name || '') : ''}
        </div>
      </div>
      <div style="margin-bottom: 5px; margin-left: 20px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">POSITION:</div>
        <div style="border: 1px solid #000; height: 18px; padding: 1px 5px; font-size: 10px;">
          ${profile.working_status === 'Yes' ? (profile.position_name || '') : ''}
        </div>
      </div>

      <!-- Licensed Professional - Always show -->
      <div style="margin-bottom: 5px; margin-left: 20px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">ARE YOU A LICENSED PROFESSIONAL?</div>
        <div style="display: flex; align-items: center;">
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.working_status === 'Yes' && profile.licensed_professional === 'Yes' ? '#000' : '#fff'};"></div>
          <span style="margin-right: 20px; font-size: 10px;">YES</span>
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.working_status === 'Yes' && profile.licensed_professional === 'No' ? '#000' : '#fff'};"></div>
          <span style="font-size: 10px;">NO</span>
          
          <span style="margin-left: 20px; font-size: 10px; font-weight: bold;">YRS OF EMPLOYMENT:</span>
          <div style="display: inline-block; width: 25px; height: 18px; border: 1px solid #000; margin-left: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px;">
            ${profile.working_status === 'Yes' ? (profile.employment_yrs || '') : ''}
          </div>
        </div>
      </div>

      <!-- Income Range - Always show -->
      <div style="margin-bottom: 5px; margin-left: 20px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">MONTHLY INCOME RANGE:</div>
        <div style="display: flex; flex-wrap: wrap;">
          ${[
            { label: 'BELOW ₱50,000', value: 'Below ₱50,000' },
            { label: '₱50,001 to ₱100,000', value: '₱50,001 to ₱100,000' },
            { label: '₱100,001 to ₱150,000', value: '₱100,001 to ₱150,000' },
            { label: '₱150,001 to ₱200,000', value: '₱150,001 to ₱200,000' },
            { label: '₱200,001 to ₱250,000', value: '₱200,001 to ₱250,000' },
            { label: 'ABOVE ₱250,000', value: 'Above ₱250,000' },
            { label: 'PREFER NOT TO DISCLOSE', value: 'Prefer to not disclose' }
          ].map(range => {
            const isChecked = profile.working_status === 'Yes' && profile.monthly_income === range.value;
            return `
              <div style="display: flex; align-items: center; margin-right: 10px; margin-bottom: 3px; width: 32%;">
                <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${isChecked ? '#000' : '#fff'};"></div>
                <span style="font-size: 9px;">${range.label}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Youth Organization -->
      <div style="margin-bottom: 5px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">ARE YOU A MEMBER OF YOUTH ORGANIZATION IN OUR BRGY?</div>
        <div style="display: flex; align-items: center;">
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.youth_org === 'Yes' ? '#000' : '#fff'};"></div>
          <span style="margin-right: 20px; font-size: 10px;">YES</span>
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.youth_org === 'No' ? '#000' : '#fff'};"></div>
          <span style="font-size: 10px;">NO</span>
        </div>
      </div>

      <!-- Youth Organization Details - Always show even if not a member -->
      <div style="margin-bottom: 5px; margin-left: 20px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">IF YES, INDICATE NAME OF ORGANIZATION.</div>
        <div style="border: 1px solid #000; height: 18px; padding: 1px 5px; font-size: 10px;">
          ${profile.youth_org === 'Yes' ? (profile.org_name || '') : ''}
        </div>
      </div>
      <div style="margin-bottom: 5px; margin-left: 20px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">IF YES, INDICATE POSITION IN THE ORG.</div>
        <div style="border: 1px solid #000; height: 18px; padding: 1px 5px; font-size: 10px;">
          ${profile.youth_org === 'Yes' ? (profile.org_position || '') : ''}
        </div>
      </div>

      <!-- LGBTQIA+ Community -->
      <div style="margin-bottom: 5px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">ARE YOU A MEMBER/PART OF THE LGBTQIA+ COMMUNITY?</div>
        <div style="display: flex; align-items: center;">
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.lgbtqia_member === 'Yes' ? '#000' : '#fff'};"></div>
          <span style="margin-right: 20px; font-size: 10px;">YES</span>
          <div style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; background-color: ${profile.lgbtqia_member === 'No' ? '#000' : '#fff'};"></div>
          <span style="font-size: 10px;">NO</span>
        </div>
      </div>

      <!-- OSY Ranking - Always show -->
      <div style="margin-bottom: 5px;">
        <div style="font-weight: bold; margin-bottom: 1px; font-size: 10px;">IF AN OUT-OF-SCHOOL YOUTH, RANK FROM 1 TO 3.</div>
        <div style="display: flex; flex-wrap: wrap;">
          ${[
            { label: 'EMPLOYMENT', field: 'Employment' },
            { label: 'BUSINESS', field: 'Business' },
            { label: 'SCHOOLING', field: 'Schooling' }
          ].map(item => {
            let rank = '';
            
            if (profile.youth_classification === 'Out of School Youth' && osyRanking) {
              rank = osyRanking[item.field] || '';
            }
            
            return `
              <div style="display: flex; align-items: center; margin-right: 15px; margin-bottom: 3px;">
                <div style="display: inline-block; width: 18px; height: 18px; border: 1px solid #000; margin-right: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px;">${rank}</div>
                <span style="font-size: 10px;">${item.label}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>`;

    tempDiv.appendChild(secondPageDiv);

    // After adding the HTML content, insert the logo
    const logoContainer = tempDiv.querySelector('#logo-container');
    if (logoContainer) {
      logoContainer.appendChild(logoImgElement);
    }

    // Use html2canvas with modified options to ensure all content is captured
    html2canvas(tempDiv, { 
      scale: 1.5, // Adjusted scale for better resolution while maintaining file size
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      height: tempDiv.scrollHeight, // Capture full height
      windowWidth: 794,
      windowHeight: 1123,
      // These are important to ensure we capture all content
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('.youth-profile-form');
        if (clonedElement) {
          clonedElement.style.height = 'auto';
          clonedElement.style.overflow = 'visible';
        }
      }
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Reduced quality slightly for file size
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Split canvas into two halves (approximately for the two pages)
      const halfHeight = canvas.height / 2;
      
      // Add first page
      const firstPageCanvas = document.createElement('canvas');
      firstPageCanvas.width = canvas.width;
      firstPageCanvas.height = halfHeight;
      const firstPageCtx = firstPageCanvas.getContext('2d');
      firstPageCtx.drawImage(canvas, 0, 0, canvas.width, halfHeight, 0, 0, canvas.width, halfHeight);
      const firstPageData = firstPageCanvas.toDataURL('image/jpeg', 0.95);
      
      // Calculate ratio to fit on page
      const ratio1 = Math.min(pdfWidth / canvas.width, pdfHeight / halfHeight);
      const imgX1 = (pdfWidth - canvas.width * ratio1) / 2;
      const imgY1 = 10;
      
      pdf.addImage(firstPageData, 'JPEG', imgX1, imgY1, canvas.width * ratio1, halfHeight * ratio1);
      
      // Add second page
      pdf.addPage();
      
      const secondPageCanvas = document.createElement('canvas');
      secondPageCanvas.width = canvas.width;
      secondPageCanvas.height = canvas.height - halfHeight;
      const secondPageCtx = secondPageCanvas.getContext('2d');
      secondPageCtx.drawImage(canvas, 0, halfHeight, canvas.width, canvas.height - halfHeight, 0, 0, canvas.width, canvas.height - halfHeight);
      const secondPageData = secondPageCanvas.toDataURL('image/jpeg', 0.95);
      
      // Calculate ratio to fit on page
      const ratio2 = Math.min(pdfWidth / canvas.width, pdfHeight / (canvas.height - halfHeight));
      const imgX2 = (pdfWidth - canvas.width * ratio2) / 2;
      const imgY2 = 10;
      
      pdf.addImage(secondPageData, 'JPEG', imgX2, imgY2, canvas.width * ratio2, (canvas.height - halfHeight) * ratio2);
      
      pdf.save(`youth-profile-${profile.first_name}-${profile.last_name}.pdf`);
      
      // Clean up the temporary div
      document.body.removeChild(tempDiv);
    });
  };

  if (buttonType === 'table-action') {
    return (
      <button 
        className="btn btn-info btn-sm" 
        onClick={handleExport}
        title="Export to PDF Form"
        style={{ marginLeft: '5px' }}
      >
        <FaFilePdf />
      </button>
    );
  }

  return (
    <button 
      className="btn btn-success"
      onClick={handleExport}
    >
      Download SK Form
    </button>
  );
};

export default YouthProfilePdfExport;