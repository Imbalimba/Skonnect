import React, { useState, useEffect, useContext } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';
import axios from 'axios';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { AuthContext } from '../../Contexts/AuthContext';
import '../css/Forecast.css';

// Register ChartDataLabels plugin
Chart.register(ChartDataLabels);

const ForecastComponent = () => {
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [barangays, setBarangays] = useState([]);
  const [activeTab, setActiveTab] = useState('voters');
  const [expandedSections, setExpandedSections] = useState([0]);
  const [forecastYear, setForecastYear] = useState(new Date().getFullYear() + 1);
  const { skUser } = useContext(AuthContext);
  
  // Determine if user is federation admin (can see all barangays)
  const isFederationAdmin = skUser?.sk_role === 'Federasyon';
  
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // Build query parameters
        let params = new URLSearchParams();
        
        // If not federation admin, filter by user's barangay
        if (skUser && !isFederationAdmin) {
          params.append('barangay', skUser.sk_station);
        }
        
        // Make the API call with the params
        const response = await axios.get(`/api/profiles?${params.toString()}`);
        setProfiles(response.data);
  
        // Set predefined barangays
        const predefinedBarangays = [
          'Dela Paz', 
          'Manggahan', 
          'Maybunga', 
          'Pinagbuhatan', 
          'Rosario', 
          'San Miguel', 
          'Santa Lucia', 
          'Santolan'
        ];
        setBarangays(predefinedBarangays);
        
        // Set default selected barangay based on user role
        if (skUser && !isFederationAdmin) {
          setSelectedBarangay(skUser.sk_station);
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
      }
    };
  
    fetchProfiles();
  }, [skUser, isFederationAdmin]);
  
  useEffect(() => {
    // Filter profiles by selected barangay
    if (selectedBarangay) {
      setFilteredProfiles(profiles.filter((profile) => profile.barangay === selectedBarangay));
    } else {
      // If no barangay is selected, show only data from user's barangay if not federation admin
      if (skUser && !isFederationAdmin) {
        setFilteredProfiles(profiles.filter((profile) => profile.barangay === skUser.sk_station));
      } else {
        setFilteredProfiles(profiles); // Show all profiles if federation admin and no barangay selected
      }
    }
  }, [selectedBarangay, profiles, skUser, isFederationAdmin]);

  const handleBarangayChange = (event) => {
    setSelectedBarangay(event.target.value);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const toggleSection = (index) => {
    if (expandedSections.includes(index)) {
      setExpandedSections(expandedSections.filter(i => i !== index));
    } else {
      setExpandedSections([...expandedSections, index]);
    }
  };

  // Chart options
  const responsiveChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 10
          }
        }
      },
      datalabels: {
        display: true,
        color: '#fff',
        font: {
          weight: 'bold',
          size: 10
        }
      }
    }
  };

  const pieOptionsWithPercentages = {
    ...responsiveChartOptions,
    plugins: {
      ...responsiveChartOptions.plugins,
      datalabels: {
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
          if (total === 0) return '';
          const percentage = ((value / total) * 100).toFixed(1) + '%';
          return percentage;
        },
        color: '#fff',
        font: {
          weight: 'bold',
          size: 10,
        },
        display: function(context) {
          const value = context.dataset.data[context.dataIndex];
          return value > 0;
        }
      }
    }
  };

  // Helper function to calculate age in a given year
  // Helper function to calculate age in a given year
const calculateAgeInYear = (birthdate, year) => {
  if (!birthdate) return null;
  
  const birthDate = new Date(birthdate);
  const targetDate = new Date(year, 0, 1); // January 1st of the target year
  
  let age = targetDate.getFullYear() - birthDate.getFullYear();
  
  // Adjust if birthday hasn't occurred in the target year
  if (targetDate.getMonth() < birthDate.getMonth() || 
      (targetDate.getMonth() === birthDate.getMonth() && targetDate.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};
  // Forecasting functions

  // 1. Voter Turnout Forecast
const forecastVoterTurnout = () => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, forecastYear];
  
  // Current SK voters (ages 15-30)
  const currentSKVoters = filteredProfiles.filter(p => p.sk_voter === 'Yes').length;
  
  // Current National voters (ages 18+)
  const currentNationalVoters = filteredProfiles.filter(p => p.national_voter === 'Yes').length;
  
  // Voters who actually voted in last election
  const baseTurnout = filteredProfiles.filter(p => p.did_vote_last_election === 'Yes').length;
  
  // Calculate new national voter eligibility (those turning 18 in forecast year)
  const newNationalVoterEligible = filteredProfiles.filter(p => {
    const currentAge = calculateAgeInYear(p.birthdate, currentYear);
    const futureAge = calculateAgeInYear(p.birthdate, forecastYear);
    return currentAge < 18 && futureAge >= 18;
  }).length;
  
  // Project new SK voters (those turning 15 in forecast year but currently under 15)
  const newSKVoterEligible = filteredProfiles.filter(p => {
    const currentAge = calculateAgeInYear(p.birthdate, currentYear);
    const futureAge = calculateAgeInYear(p.birthdate, forecastYear);
    return currentAge < 15 && futureAge >= 15 && futureAge <= 30;
  }).length;
  
  // Engagement factors
  const engagementFactor = filteredProfiles.filter(p => p.youth_org === 'Yes').length / filteredProfiles.length;
  const educationFactor = filteredProfiles.filter(p => p.educational_background.includes('College')).length / filteredProfiles.length;
  const attendanceFactor = filteredProfiles.filter(p => p.kk_assembly_attendance === 'Yes').length / filteredProfiles.length;
  
  // Calculate projected voters
  const projectedSKVoters = currentSKVoters + newSKVoterEligible;
  const projectedNationalVoters = currentNationalVoters + newNationalVoterEligible;
  
  // Weighted projection for turnout
  const turnoutRate = baseTurnout / currentSKVoters;
  const projectedTurnout = Math.round(
    projectedSKVoters * turnoutRate * 
    (1 + (0.05 + (engagementFactor * 0.02) + (educationFactor * 0.01) + (attendanceFactor * 0.03)))
  );
  
  return {
    labels: years,
    datasets: [{
      label: 'SK Voters',
      data: [currentSKVoters - 10, currentSKVoters, projectedSKVoters],
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }, {
      label: 'National Voters',
      data: [currentNationalVoters - 5, currentNationalVoters, projectedNationalVoters],
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1
    }, {
      label: 'Actual Turnout',
      data: [baseTurnout - 8, baseTurnout, projectedTurnout],
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
      type: 'line'
    }]
  };
};

  // 2. Age Group Projection
const forecastAgeGroups = () => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, forecastYear];
  
  // Current age groups
  const currentChildYouth = filteredProfiles.filter(p => {
    const age = calculateAgeInYear(p.birthdate, currentYear);
    return age >= 15 && age <= 17;
  }).length;
  
  const currentCoreYouth = filteredProfiles.filter(p => {
    const age = calculateAgeInYear(p.birthdate, currentYear);
    return age >= 18 && age <= 24;
  }).length;
  
  const currentYoungAdult = filteredProfiles.filter(p => {
    const age = calculateAgeInYear(p.birthdate, currentYear);
    return age >= 25 && age <= 30;
  }).length;
  
  // Projected age groups
  const projectedChildYouth = filteredProfiles.filter(p => {
    const age = calculateAgeInYear(p.birthdate, forecastYear);
    return age >= 15 && age <= 17;
  }).length;
  
  const projectedCoreYouth = filteredProfiles.filter(p => {
    const age = calculateAgeInYear(p.birthdate, forecastYear);
    return age >= 18 && age <= 24;
  }).length;
  
  const projectedYoungAdult = filteredProfiles.filter(p => {
    const age = calculateAgeInYear(p.birthdate, forecastYear);
    return age >= 25 && age <= 30;
  }).length;
  
  // Calculate aging out (31+)
  const agingOut = filteredProfiles.filter(p => {
    const age = calculateAgeInYear(p.birthdate, forecastYear);
    return age > 30;
  }).length;

  // Calculate transitions between groups
  const movingToCoreYouth = filteredProfiles.filter(p => {
    const currentAge = calculateAgeInYear(p.birthdate, currentYear);
    const futureAge = calculateAgeInYear(p.birthdate, forecastYear);
    return currentAge >= 15 && currentAge <= 17 && futureAge >= 18 && futureAge <= 24;
  }).length;

  const movingToYoungAdult = filteredProfiles.filter(p => {
    const currentAge = calculateAgeInYear(p.birthdate, currentYear);
    const futureAge = calculateAgeInYear(p.birthdate, forecastYear);
    return currentAge >= 18 && currentAge <= 24 && futureAge >= 25 && futureAge <= 30;
  }).length;

  const movingOut = filteredProfiles.filter(p => {
    const currentAge = calculateAgeInYear(p.birthdate, currentYear);
    const futureAge = calculateAgeInYear(p.birthdate, forecastYear);
    return currentAge >= 25 && currentAge <= 30 && futureAge > 30;
  }).length;

  return {
    labels: ['Child Youth (15-17)', 'Core Youth (18-24)', 'Young Adult (25-30)', 'Aging Out (31+)'],
    datasets: [
      {
        label: `Current (${currentYear})`,
        data: [currentChildYouth, currentCoreYouth, currentYoungAdult, 0], // 0 for aging out in current year
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: `Projected (${forecastYear})`,
        data: [projectedChildYouth, projectedCoreYouth, projectedYoungAdult, agingOut],
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }
    ],
    transitions: {
      toCoreYouth: movingToCoreYouth,
      toYoungAdult: movingToYoungAdult,
      agingOut: movingOut
    }
  };
};

  // 3. Education Level Projection
const forecastEducationLevels = () => {
  const educationLevels = [
    'No Formal Education',
    'Elementary Level',
    'Elementary Grad',
    'High School Level',
    'High School Grad',
    'Vocational Grad',
    'College Level',
    'College Grad',
    'Masters Level',
    'Masters Grad',
    'Doctorate Level',
    'Doctorate Grad'
  ];

  const currentEducation = filteredProfiles.reduce((acc, p) => {
    if (p.educational_background) {
      acc[p.educational_background] = (acc[p.educational_background] || 0) + 1;
    }
    return acc;
  }, {});

  educationLevels.forEach(level => {
    if (!currentEducation[level]) {
      currentEducation[level] = 0;
    }
  });

  const projectedEducation = { ...currentEducation };
  const yearsDifference = forecastYear - new Date().getFullYear();

  if (yearsDifference >= 1) {
    filteredProfiles.forEach(profile => {
      const currentEdu = profile.educational_background;
      const studyingLevel = profile.studying_level;
      const yearLevel = profile.yearlevel ? parseInt(profile.yearlevel) : 0;

      if (!currentEdu) return;

      switch (currentEdu) {
        case 'Elementary Level':
          if (yearsDifference >= 3) {
            projectedEducation['Elementary Level']--;
            projectedEducation['Elementary Grad']++;
          }
          break;

        case 'Elementary Grad':
          projectedEducation['Elementary Grad']--;
          projectedEducation['High School Level']++;
          break;

        case 'High School Level':
          if (studyingLevel === 'Secondary' && yearLevel >= 10 && yearsDifference >= 2) {
            projectedEducation['High School Level']--;
            projectedEducation['High School Grad']++;
          }
          break;

        case 'High School Grad':
          projectedEducation['High School Grad']--;
          if (Math.random() < 0.5) {
            projectedEducation['College Level']++;
          } else {
            projectedEducation['Vocational Grad']++;
          }
          break;

        case 'College Level':
          if (studyingLevel === 'Tertiary' && yearLevel >= 3 && yearsDifference >= 2) {
            projectedEducation['College Level']--;
            projectedEducation['College Grad']++;
          }
          break;

        case 'College Grad':
          if (yearsDifference >= 2 && Math.random() < 0.1) {
            projectedEducation['College Grad']--;
            projectedEducation['Masters Level']++;
          }
          break;

        case 'Masters Level':
          if (yearsDifference >= 2 && Math.random() < 0.5) {
            projectedEducation['Masters Level']--;
            projectedEducation['Masters Grad']++;
          }
          break;

        case 'Masters Grad':
          if (yearsDifference >= 3 && Math.random() < 0.3) {
            projectedEducation['Masters Grad']--;
            projectedEducation['Doctorate Level']++;
          }
          break;

        case 'Doctorate Level':
          if (yearsDifference >= 3 && Math.random() < 0.5) {
            projectedEducation['Doctorate Level']--;
            projectedEducation['Doctorate Grad']++;
          }
          break;

        case 'No Formal Education':
          if (Math.random() < 0.7) {
            const paths = ['Elementary Level', 'Vocational Grad'];
            const chosen = paths[Math.floor(Math.random() * paths.length)];
            projectedEducation['No Formal Education']--;
            projectedEducation[chosen]++;
          }
          break;

        default:
          break;
      }
    });

    projectedEducation['High School Level'] = Math.max(0, 
      projectedEducation['High School Level'] - 
      Math.round(projectedEducation['High School Level'] * 0.05 * yearsDifference)
    );

    projectedEducation['College Level'] = Math.max(0, 
      projectedEducation['College Level'] - 
      Math.round(projectedEducation['College Level'] * 0.1 * yearsDifference)
    );

    const vocationalShift = Math.round(projectedEducation['High School Grad'] * 0.2);
    projectedEducation['High School Grad'] -= vocationalShift;
    projectedEducation['Vocational Grad'] += vocationalShift;

    const mastersPursuit = Math.round(projectedEducation['College Grad'] * 0.05);
    projectedEducation['College Grad'] -= mastersPursuit;
    projectedEducation['Masters Level'] += mastersPursuit;
  }

  return {
    labels: educationLevels,
    datasets: [
      {
        label: 'Current Education',
        data: educationLevels.map(level => currentEducation[level] || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Projected Education',
        data: educationLevels.map(level => projectedEducation[level] || 0),
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1
      }
    ],
    currentEducation,
    projectedEducation
  };
};

  // 4. Employment Projection
const forecastEmployment = () => {
  // Get education projection data
  const educationData = forecastEducationLevels();
  const currentEducation = educationData.currentEducation || {};
  const projectedEducation = educationData.projectedEducation || {};
  
  // Current employment status
  const currentEmployment = filteredProfiles.reduce((acc, p) => {
    if (p.work_status) {
      acc[p.work_status] = (acc[p.work_status] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Projected employment status
  const projectedEmployment = { ...currentEmployment };
  
  // Calculate employment probability based on education level
  const getEmploymentProbability = (educationLevel) => {
    switch(educationLevel) {
      case 'Doctorate Grad': return 0.95;
      case 'Masters Grad': return 0.90;
      case 'College Grad': return 0.85;
      case 'Vocational Grad': return 0.80;
      case 'High School Grad': return 0.65;
      case 'Elementary Grad': return 0.40;
      case 'High School Level': return 0.15;
      case 'Elementary Level': return 0.05;
      default: return 0.30;
    }
  };

  // Calculate employment changes based on education progression
  const educationChanges = {};
  Object.keys(projectedEducation).forEach(level => {
    const change = projectedEducation[level] - (currentEducation[level] || 0);
    if (change !== 0) {
      educationChanges[level] = change;
    }
  });

  // Adjust employment based on education changes
  Object.entries(educationChanges).forEach(([level, change]) => {
    const prob = getEmploymentProbability(level);
    const employmentChange = Math.round(change * prob);
    
    if (employmentChange > 0) {
      // Distribute new employment across statuses
      projectedEmployment['Employed'] = (projectedEmployment['Employed'] || 0) + Math.round(employmentChange * 0.7);
      projectedEmployment['Self Employed'] = (projectedEmployment['Self Employed'] || 0) + Math.round(employmentChange * 0.2);
      projectedEmployment['Currently Looking For a Job'] = (projectedEmployment['Currently Looking For a Job'] || 0) + Math.round(employmentChange * 0.1);
    } else if (employmentChange < 0) {
      // Handle decreases (like dropping out)
      projectedEmployment['Unemployed'] = (projectedEmployment['Unemployed'] || 0) + Math.abs(employmentChange);
    }
  });

  // Adjust for current unemployed/job seekers based on education
  const currentUnemployed = projectedEmployment['Unemployed'] || 0;
  const currentJobSeekers = projectedEmployment['Currently Looking For a Job'] || 0;
  
  if (currentUnemployed > 0) {
    const avgEducationLevel = calculateAverageEducationLevel(filteredProfiles);
    const placementRate = avgEducationLevel >= 3 ? 0.15 : 0.10; // Higher for more educated populations
    
    projectedEmployment['Employed'] = (projectedEmployment['Employed'] || 0) + Math.round(currentUnemployed * placementRate);
    projectedEmployment['Unemployed'] = Math.round(currentUnemployed * (1 - placementRate));
  }
  
  if (currentJobSeekers > 0) {
    const avgEducationLevel = calculateAverageEducationLevel(filteredProfiles);
    const placementRate = avgEducationLevel >= 3 ? 0.25 : 0.15; // Higher for more educated populations
    
    projectedEmployment['Employed'] = (projectedEmployment['Employed'] || 0) + Math.round(currentJobSeekers * placementRate);
    projectedEmployment['Currently Looking For a Job'] = Math.round(currentJobSeekers * (1 - placementRate));
  }

  return {
    labels: Object.keys(currentEmployment),
    datasets: [
      {
        label: 'Current',
        data: Object.values(currentEmployment),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Projected',
        data: Object.values(projectedEmployment),
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1
      }
    ],
    educationChanges,
    currentEducation,
    projectedEducation
  };
};

// Helper function to calculate average education level
const calculateAverageEducationLevel = (profiles) => {
  const educationLevels = [
    'No Formal Education',
    'Elementary Level',
    'Elementary Grad',
    'High School Level',
    'High School Grad',
    'Vocational Grad',
    'College Level',
    'College Grad',
    'Masters Level',
    'Masters Grad',
    'Doctorate Level',
    'Doctorate Grad'
  ];
  
  let total = 0;
  let count = 0;
  
  profiles.forEach(profile => {
    if (profile.educational_background) {
      const index = educationLevels.indexOf(profile.educational_background);
      if (index >= 0) {
        total += index;
        count++;
      }
    }
  });
  
  return count > 0 ? total / count : 0;
};

  // 5. KK Assembly Attendance Projection - Improved Version
const forecastAssemblyAttendance = () => {
  // Current attendance counts
  const currentAttendance = filteredProfiles.reduce((acc, p) => {
    if (p.kk_assembly_attendance) {
      acc[p.kk_assembly_attendance] = (acc[p.kk_assembly_attendance] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Calculate weights for different profiles
  const getAvailabilityWeight = (profile) => {
    if (!profile.educational_background) return 0.8; // Default if missing
    
    // High school students get full weight (more available)
    if (profile.educational_background.includes('High School')) {
      return 1.2;
    }
    
    // College students get reduced weight unless unemployed
    if (profile.educational_background.includes('College')) {
      return profile.work_status === 'Unemployed' ? 0.9 : 0.6;
    }
    
    // Vocational students neutral weight
    if (profile.educational_background.includes('Vocational')) {
      return 1.0;
    }
    
    return 0.8; // Default weight for others
  };

  // Calculate weighted engagement factor
  const engagementFactor = filteredProfiles.reduce((sum, p) => {
    return sum + (p.youth_org === 'Yes' ? 1.2 : 0.8) * getAvailabilityWeight(p);
  }, 0) / filteredProfiles.length;

  // Base improvement ranges from 5-25% based on factors
  const totalImprovement = Math.min(0.25, Math.max(0.05, 
    (engagementFactor - 0.8) * 0.5  // Scaled to reasonable range
  ));

  // Projected attendance
  const projectedAttendance = { ...currentAttendance };
  if (projectedAttendance['No']) {
    const newAttendees = Math.round(projectedAttendance['No'] * totalImprovement);
    projectedAttendance['Yes'] = (projectedAttendance['Yes'] || 0) + newAttendees;
    projectedAttendance['No'] = Math.round(projectedAttendance['No'] * (1 - totalImprovement));
  }

  // Calculate insights data
  const currentYes = currentAttendance['Yes'] || 0;
  const currentNo = currentAttendance['No'] || 0;
  const total = currentYes + currentNo;
  const currentRate = total > 0 ? (currentYes / total) * 100 : 0;
  const projectedRate = total > 0 ? ((projectedAttendance['Yes'] || 0) / total) * 100 : 0;

  // Count college students
  const collegeStudents = filteredProfiles.filter(p => 
    p.educational_background?.includes('College')
  ).length;

  return {
    chartData: {
      labels: Object.keys(currentAttendance),
      datasets: [
        {
          label: 'Current',
          data: Object.values(currentAttendance),
          backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(75, 192, 192, 0.5)'],
          borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'],
          borderWidth: 1
        },
        {
          label: 'Projected',
          data: Object.values(projectedAttendance),
          backgroundColor: ['rgba(255, 159, 64, 0.5)', 'rgba(54, 162, 235, 0.5)'],
          borderColor: ['rgba(255, 159, 64, 1)', 'rgba(54, 162, 235, 1)'],
          borderWidth: 1
        }
      ]
    },
    insights: {
      currentRate: currentRate.toFixed(1),
      projectedRate: projectedRate.toFixed(1),
      improvement: (projectedRate - currentRate).toFixed(1),
      newAttendees: projectedAttendance['Yes'] - (currentAttendance['Yes'] || 0),
      improvementPercentage: (totalImprovement * 100).toFixed(1),
      collegeStudents,
      highSchoolStudents: filteredProfiles.filter(p => 
        p.educational_background?.includes('High School')
      ).length
    }
  };
};

  // 6. Enhanced Youth Classification Projection
const forecastYouthClassification = () => {
  // Current classification counts
  const currentClassification = filteredProfiles.reduce((acc, p) => {
    if (p.youth_classification) {
      acc[p.youth_classification] = (acc[p.youth_classification] || 0) + 1;
    }
    return acc;
  }, {});

  // Identify college students nearing graduation
  const graduatingSeniors = filteredProfiles.filter(p => {
    const education = p.educational_background || '';
    return (education.includes('Senior') || 
           education.includes('4th Year') || 
           education.includes('Graduating'));
  }).length;

  // Transition rates (adjust these based on your community data)
  const collegeCompletionRate = 0.70; // 70% of seniors will graduate
  const highSchoolToCollegeRate = 0.30; // 30% of HS students enter college
  const directToWorkRate = 0.40; // 40% of graduates go straight to work
  const collegeToOSYRate = 0.10; // 10% of graduates become OSY temporarily

  // Clone current counts for projection
  const projectedClassification = JSON.parse(JSON.stringify(currentClassification));

  // Calculate transitions
  if (projectedClassification['In School Youth']) {
    // College graduates going to work
    const newGraduates = Math.round(graduatingSeniors * collegeCompletionRate);
    const directToWork = Math.round(newGraduates * directToWorkRate);
    const tempOSY = Math.round(newGraduates * collegeToOSYRate);
    const remainingStudents = newGraduates - directToWork - tempOSY;

    // High school to college transition
    const toCollege = Math.round(
      (projectedClassification['In School Youth'] - graduatingSeniors) * 
      highSchoolToCollegeRate
    );

    // Apply transitions
    projectedClassification['In School Youth'] -= (newGraduates + toCollege);
    projectedClassification['Working Youth'] = 
      (projectedClassification['Working Youth'] || 0) + directToWork;
    projectedClassification['Out of School Youth'] = 
      (projectedClassification['Out of School Youth'] || 0) + tempOSY;
    projectedClassification['In School Youth'] += remainingStudents; // Those continuing education
  }

  // Calculate insights data
  const totalYouth = filteredProfiles.length;
  const currentInSchool = currentClassification['In School Youth'] || 0;
  const currentOSY = currentClassification['Out of School Youth'] || 0;
  const currentWorking = currentClassification['Working Youth'] || 0;
  
  const projectedInSchool = projectedClassification['In School Youth'] || 0;
  const projectedOSY = projectedClassification['Out of School Youth'] || 0;
  const projectedWorking = projectedClassification['Working Youth'] || 0;

  const newWorkers = Math.round(graduatingSeniors * collegeCompletionRate * directToWorkRate);

  return {
    chartData: {
      labels: Object.keys(currentClassification),
      datasets: [
        {
          label: 'Current',
          data: Object.values(currentClassification),
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        },
        {
          label: 'Projected',
          data: Object.values(projectedClassification),
          backgroundColor: 'rgba(255, 206, 86, 0.5)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1
        }
      ]
    },
    insights: {
      totalYouth,
      currentInSchool,
      currentOSY,
      currentWorking,
      projectedInSchool,
      projectedOSY,
      projectedWorking,
      graduatingSeniors,
      newWorkers,
      newCollegeStudents: Math.round(
        (currentClassification['In School Youth'] - graduatingSeniors) * highSchoolToCollegeRate
      )
    }
  };
};

  return (
    <div className="forecast-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="header-title">
            <h1>Youth Profile Forecasting</h1>
            <p>{selectedBarangay || (skUser && !isFederationAdmin ? skUser.sk_station : 'All Barangays')} • {filteredProfiles.length} Youth Profiles</p>
          </div>
          
          {/* Only show barangay dropdown for federation admins */}
          {isFederationAdmin && (
            <div className="barangay-dropdown-container">
              <select
                id="barangay-select"
                value={selectedBarangay}
                onChange={handleBarangayChange}
                className="barangay-dropdown"
              >
                <option value="">All Barangays</option>
                {barangays.map((barangay) => (
                  <option key={barangay} value={barangay}>
                    {barangay}
                  </option>
                ))}
              </select>
              <span className="dropdown-icon">
                <FaChevronDown />
              </span>
            </div>
          )}
          
          {/* For non-federation users, show a static indicator of their barangay */}
          {!isFederationAdmin && skUser && (
            <div className="barangay-indicator">
              <span className="badge bg-primary">Barangay: {skUser.sk_station}</span>
            </div>
          )}
        </div>
        
        <div className="header-right">
          <div className="year-selector">
            <label htmlFor="forecast-year">Forecast Year:</label>
            <select
              id="forecast-year"
              value={forecastYear}
              onChange={(e) => setForecastYear(parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map(y => (
                <option key={y} value={new Date().getFullYear() + y}>
                  {new Date().getFullYear() + y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="forecast-tabs">
        <button 
          className={`tab-button ${activeTab === 'voters' ? 'active' : ''}`}
          onClick={() => handleTabChange('voters')}
        >
          Voter Projections
        </button>
        <button 
          className={`tab-button ${activeTab === 'age' ? 'active' : ''}`}
          onClick={() => handleTabChange('age')}
        >
          Age Group Projections
        </button>
        <button 
          className={`tab-button ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => handleTabChange('education')}
        >
          Education Projections
        </button>
        <button 
          className={`tab-button ${activeTab === 'employment' ? 'active' : ''}`}
          onClick={() => handleTabChange('employment')}
        >
          Employment Projections
        </button>
        <button 
          className={`tab-button ${activeTab === 'assembly' ? 'active' : ''}`}
          onClick={() => handleTabChange('assembly')}
        >
          Assembly Attendance
        </button>
        <button 
          className={`tab-button ${activeTab === 'classification' ? 'active' : ''}`}
          onClick={() => handleTabChange('classification')}
        >
          Youth Classification
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
      {activeTab === 'voters' && (
  <div className="forecast-section">
    <h2>Voter Turnout Projection</h2>
    <div className="chart-container">
      <div className="chart-wrapper">
        <Line 
          data={forecastVoterTurnout()} 
          options={{
            ...responsiveChartOptions,
            plugins: {
              title: {
                display: true,
                text: `Projected Voter Eligibility and Turnout for ${forecastYear}`,
                font: {
                  size: 16
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Voters'
                }
              }
            }
          }} 
        />
      </div>
    </div>
    <div className="forecast-insights">
      <h3>Insights</h3>
      <ul>
        <li>SK voters: Youth aged 15-30 eligible to vote in SK elections</li>
        <li>National voters: Youth aged 18+ eligible to vote in national elections</li>
        <li>
          {(() => {
            const currentYear = new Date().getFullYear();
            const newNationalVoters = filteredProfiles.filter(p => {
              const currentAge = calculateAgeInYear(p.birthdate, currentYear);
              const futureAge = calculateAgeInYear(p.birthdate, forecastYear);
              return currentAge < 18 && futureAge >= 18;
            }).length;
            
            return `${newNationalVoters} youth will become eligible for national voting by ${forecastYear}`;
          })()}
        </li>
        <li>
          {(() => {
            const currentYear = new Date().getFullYear();
            const newSKVoters = filteredProfiles.filter(p => {
              const currentAge = calculateAgeInYear(p.birthdate, currentYear);
              const futureAge = calculateAgeInYear(p.birthdate, forecastYear);
              return currentAge < 15 && futureAge >= 15 && futureAge <= 30;
            }).length;
            
            return `${newSKVoters} youth will become eligible for SK voting by ${forecastYear}`;
          })()}
        </li>
        <li>Projection considers youth engagement levels and educational attainment</li>
        <li>Actual turnout influenced by KK assembly attendance and organizational participation</li>
      </ul>
    </div>
  </div>
)}

{activeTab === 'age' && (
  <div className="forecast-section">
    <h2>Age Group Projection</h2>
    <div className="chart-container">
      <div className="chart-wrapper">
        <Bar 
          data={forecastAgeGroups()} 
          options={{
            ...responsiveChartOptions,
            plugins: {
              title: {
                display: true,
                text: `Age Group Distribution Projection for ${forecastYear}`,
                font: {
                  size: 16
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Youth'
                }
              }
            }
          }} 
        />
      </div>
    </div>
    <div className="forecast-insights">
      <h3>Insights</h3>
      <ul>
        <li>
          {(() => {
            const ageData = forecastAgeGroups();
            return `${ageData.transitions.toCoreYouth} youth will move from Child Youth (15-17) to Core Youth (18-24) by ${forecastYear}`;
          })()}
        </li>
        <li>
          {(() => {
            const ageData = forecastAgeGroups();
            return `${ageData.transitions.toYoungAdult} youth will move from Core Youth (18-24) to Young Adult (25-30) by ${forecastYear}`;
          })()}
        </li>
        <li>
          {(() => {
            const ageData = forecastAgeGroups();
            return `${ageData.transitions.agingOut} youth will age out of the SK program (31+) by ${forecastYear}`;
          })()}
        </li>
        <li>The projection shows how current youth will transition between age categories</li>
        <li>Helps plan for leadership transition as youth age out of the program</li>
        <li>Identifies upcoming needs for different age-appropriate programs</li>
      </ul>
    </div>
  </div>
)}

{activeTab === 'education' && (() => {
  const educationData = forecastEducationLevels();
  const current = educationData.currentEducation || {};
  const projected = educationData.projectedEducation || {};
  const get = (obj, key) => obj[key] || 0;

  const insights = [];

  // Elementary
  const currentElem = get(current, 'Elementary Level') + get(current, 'Elementary Grad');
  const projectedElem = get(projected, 'Elementary Level') + get(projected, 'Elementary Grad');
  const elemChange = projectedElem - currentElem;
  if (elemChange !== 0 && currentElem > 0) {
    insights.push(
      <li key="elem">
        Elementary students will {elemChange > 0 ? 'increase' : 'decrease'} by {Math.abs(elemChange)} ({Math.abs(Math.round((elemChange/currentElem)*100))}%) by {forecastYear}
      </li>
    );
  }

  // High School
  const currentHS = get(current, 'High School Level') + get(current, 'High School Grad');
  const projectedHS = get(projected, 'High School Level') + get(projected, 'High School Grad');
  const hsChange = projectedHS - currentHS;
  if (hsChange !== 0 && currentHS > 0) {
    insights.push(
      <li key="hs">
        High School students will {hsChange > 0 ? 'increase' : 'decrease'} by {Math.abs(hsChange)} ({Math.abs(Math.round((hsChange/currentHS)*100))}%) by {forecastYear}
      </li>
    );
  }

  // College
  const currentCollege = get(current, 'College Level') + get(current, 'College Grad');
  const projectedCollege = get(projected, 'College Level') + get(projected, 'College Grad');
  const collegeChange = projectedCollege - currentCollege;
  if (collegeChange !== 0 && currentCollege > 0) {
    insights.push(
      <li key="college">
        College students will {collegeChange > 0 ? 'increase' : 'decrease'} by {Math.abs(collegeChange)} ({Math.abs(Math.round((collegeChange/currentCollege)*100))}%) by {forecastYear}
      </li>
    );
  }

  // Vocational
  const currentVoc = get(current, 'Vocational Grad');
  const projectedVoc = get(projected, 'Vocational Grad');
  const vocChange = projectedVoc - currentVoc;
  if (vocChange > 0 && currentVoc > 0) {
    insights.push(
      <li key="voc">
        Vocational graduates will increase by {vocChange} ({Math.round((vocChange/currentVoc)*100)}%) by {forecastYear}
      </li>
    );
  }

  // Higher Education
  const currentHigher = get(current, 'Masters Level') + get(current, 'Masters Grad') + get(current, 'Doctorate Level') + get(current, 'Doctorate Grad');
  const projectedHigher = get(projected, 'Masters Level') + get(projected, 'Masters Grad') + get(projected, 'Doctorate Level') + get(projected, 'Doctorate Grad');
  const higherChange = projectedHigher - currentHigher;
  if (higherChange > 0 && currentHigher > 0) {
    insights.push(
      <li key="higher">
        Advanced degree students will increase by {higherChange} ({Math.round((higherChange/currentHigher)*100)}%) by {forecastYear}
      </li>
    );
  }

  // Dropouts
  const potentialDropouts = Math.round(
    get(current, 'High School Level') * 0.1 +
    get(current, 'College Level') * 0.15
  );
  if (potentialDropouts > 0) {
    insights.push(
      <li key="dropouts">
        Approximately {potentialDropouts} youth are at risk of dropping out based on current trends
      </li>
    );
  }

  if (insights.length === 0) {
    insights.push(
      <li key="nochange">No significant changes projected in education levels</li>
    );
  }

  return (
    <div className="forecast-section">
      <h2>Education Level Projection</h2>
      <div className="chart-container">
        <div className="chart-wrapper">
          <Bar 
            data={educationData} 
            options={{
              ...responsiveChartOptions,
              plugins: {
                title: {
                  display: true,
                  text: `Education Level Projection for ${forecastYear}`,
                  font: { size: 16 }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Youth'
                  }
                }
              }
            }} 
          />
        </div>
      </div>
      <div className="forecast-insights">
        <h3>Insights</h3>
        <ul>{insights}</ul>
      </div>
    </div>
  );
})()}

{activeTab === 'employment' && (() => {
  const employmentData = forecastEmployment();
  const current = employmentData.datasets[0].data.reduce((a, b) => a + b, 0);
  const projected = employmentData.datasets[1].data.reduce((a, b) => a + b, 0);
  const currentEmployed = employmentData.datasets[0].data[employmentData.labels.indexOf('Employed')] || 0;
  const projectedEmployed = employmentData.datasets[1].data[employmentData.labels.indexOf('Employed')] || 0;
  const employmentChange = projectedEmployed - currentEmployed;
  const employmentChangePercent = currentEmployed > 0 ? 
    Math.round((employmentChange / currentEmployed) * 100) : 0;

  const currentUnemployed = employmentData.datasets[0].data[employmentData.labels.indexOf('Unemployed')] || 0;
  const projectedUnemployed = employmentData.datasets[1].data[employmentData.labels.indexOf('Unemployed')] || 0;
  const unemployedChange = projectedUnemployed - currentUnemployed;

  const currentSelfEmployed = employmentData.datasets[0].data[employmentData.labels.indexOf('Self Employed')] || 0;
  const projectedSelfEmployed = employmentData.datasets[1].data[employmentData.labels.indexOf('Self Employed')] || 0;
  const selfEmployedChange = projectedSelfEmployed - currentSelfEmployed;

  const educationChanges = employmentData.educationChanges || {};
  const educationInsights = [];

  Object.entries(educationChanges).forEach(([level, change]) => {
    if (change > 0) {
      educationInsights.push(
        <li key={`edu-${level}`}>
          {change} youth will attain {level} education by {forecastYear}, increasing their employment potential
        </li>
      );
    }
  });

  const avgEducationLevel = calculateAverageEducationLevel(filteredProfiles);
  const educationLevelDescription = 
    avgEducationLevel >= 8 ? 'highly educated' :
    avgEducationLevel >= 5 ? 'moderately educated' :
    'less educated';

  return (
    <div className="forecast-section">
      <h2>Employment Status Projection</h2>
      <div className="chart-container">
        <div className="chart-wrapper">
          <Bar 
            data={{
              labels: employmentData.labels,
              datasets: employmentData.datasets
            }} 
            options={{
              ...responsiveChartOptions,
              plugins: {
                title: {
                  display: true,
                  text: `Employment Status Projection for ${forecastYear}`,
                  font: {
                    size: 16
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Youth'
                  }
                }
              }
            }} 
          />
        </div>
      </div>
      <div className="forecast-insights">
        <h3>Insights</h3>
        <ul>
          <li>
            Employment is projected to {employmentChange >= 0 ? 'increase' : 'decrease'} by {Math.abs(employmentChange)} (
            {Math.abs(employmentChangePercent)}%) by {forecastYear}
          </li>
          {employmentChange > 0 && (
            <li>
              This growth is primarily driven by:
              <ul>
                {educationInsights}
                <li>
                  The {educationLevelDescription} profile of this group results in a {
                    avgEducationLevel >= 8 ? 'high' :
                    avgEducationLevel >= 5 ? 'moderate' :
                    'low'
                  } employment placement rate
                </li>
              </ul>
            </li>
          )}
          {unemployedChange < 0 && (
            <li>
              Unemployment is projected to decrease by {Math.abs(unemployedChange)} due to education improvements and job placement programs
            </li>
          )}
          {selfEmployedChange > 0 && (
            <li>
              Self-employment is projected to increase by {selfEmployedChange}, reflecting entrepreneurial trends
            </li>
          )}
          <li>
            Projections account for education levels, current employment status, and historical placement rates
          </li>
        </ul>
      </div>
    </div>
  );
})()}

{activeTab === 'assembly' && (() => {
  const { chartData, insights } = forecastAssemblyAttendance();
  
  return (
    <div className="forecast-section">
      <h2>KK Assembly Attendance Projection</h2>
      <div className="chart-container">
        <div className="chart-wrapper">
          <Pie 
            data={chartData} 
            options={{
              ...pieOptionsWithPercentages,
              plugins: {
                ...pieOptionsWithPercentages.plugins,
                title: {
                  display: true,
                  text: `Assembly Attendance Projection for ${forecastYear}`,
                  font: {
                    size: 16
                  }
                }
              }
            }} 
          />
        </div>
      </div>
      <div className="forecast-insights">
        <h3>Insights</h3>
        <ul>
          <li>Current attendance rate: {insights.currentRate}%</li>
          <li>Projected attendance rate: {insights.projectedRate}% (
            {insights.improvement > 0 ? '+' : ''}{insights.improvement} percentage points)
          </li>
          <li>Expected new attendees: {insights.newAttendees} youth</li>
          
          {insights.collegeStudents > 0 && (
            <li>
              {insights.collegeStudents} college students in this group - their attendance may be 
              limited by academic/work commitments
            </li>
          )}
          
          {insights.highSchoolStudents > 0 && (
            <li>
              {insights.highSchoolStudents} high school students - typically more available 
              for assembly participation
            </li>
          )}
          
          <li>
            Projection accounts for education levels and work status when estimating 
            potential attendance growth
          </li>
        </ul>
      </div>
    </div>
  );
})()}

{activeTab === 'classification' && (() => {
  const { chartData, insights } = forecastYouthClassification();
  
  return (
    <div className="forecast-section">
      <h2>Youth Classification Projection</h2>
      <div className="chart-container">
        <div className="chart-wrapper">
          <Bar 
            data={chartData} 
            options={{
              ...responsiveChartOptions,
              plugins: {
                title: {
                  display: true,
                  text: `Youth Classification Projection for ${forecastYear}`,
                  font: {
                    size: 16
                  }
                }
              }
            }} 
          />
        </div>
      </div>
      <div className="forecast-insights">
        <h3>Insights</h3>
        <ul>  
          <li>Total youth analyzed: {insights.totalYouth}</li>
          
          <li>
            <strong>Education Transitions:</strong>
            <ul className="nested-list">
              <li>{insights.graduatingSeniors} college seniors</li>
              <li>{insights.newWorkers} expected to enter workforce directly</li>
              {insights.newCollegeStudents > 0 && (
                <li>{insights.newCollegeStudents} high school students may enter college</li>
              )}
            </ul>
          </li>
          
          <li>
            <strong>Classification Changes:</strong>
            <ul className="nested-list">
              <li>
                In School: {insights.currentInSchool} → {insights.projectedInSchool} (
                {insights.projectedInSchool > insights.currentInSchool ? '+' : ''}
                {insights.projectedInSchool - insights.currentInSchool})
              </li>
              <li>
                Working Youth: {insights.currentWorking} → {insights.projectedWorking} (
                {insights.projectedWorking > insights.currentWorking ? '+' : ''}
                {insights.projectedWorking - insights.currentWorking})
              </li>
            </ul>
          </li>
          
          <li>
            <strong>Key Assumptions:</strong>
            <ul className="nested-list">
              <li>70% college completion rate</li>
              <li>40% of graduates enter workforce directly</li>
              <li>30% of high schoolers continue to college</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
})()}
      </div>
    </div>
  );
};

export default ForecastComponent;