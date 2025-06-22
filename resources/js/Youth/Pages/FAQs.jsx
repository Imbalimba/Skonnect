import React, { useState } from 'react';
import ChatComponent from '../components/ChatComponent';
import '../css/FAQs.css';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import YouthLayout from '../Components/YouthLayout';

const FAQs = () => {
  // State to track which FAQ category is active
  const [activeCategory, setActiveCategory] = useState('General');
  
  // State to track which questions are expanded
  const [expandedQuestions, setExpandedQuestions] = useState({});
  
  // FAQ data organized by categories
  const faqCategories = {
    'General': [
      {
        id: 'gen1',
        question: 'What is Sangguniang Kabataan (SK)?',
        answer: 'The Sangguniang Kabataan (SK) is the youth council in the Philippines that represents young people aged 15 to 24 in each barangay (village). It was created to give the Filipino youth a voice in governance and to encourage their active participation in community affairs.'
      },
      {
        id: 'gen2',
        question: 'What is the role of the SK in Pasig City?',
        answer: 'The SK in Pasig City serves as the voice of the youth in local governance, implements programs that address youth concerns, and promotes youth development through various initiatives in education, sports, culture, environment, and community service.'
      },
      {
        id: 'gen3',
        question: 'How is the SK structured in Pasig City?',
        answer: 'The SK in Pasig City is structured with SK councils at the barangay level, with elected officials including a Chairperson and seven SK Council members. The chairpersons from all barangays form the SK Federation, led by an elected Federation President who serves as a member of the City Council.'
      }
    ],
    'Membership': [
      {
        id: 'mem1',
        question: 'Who can join the Sangguniang Kabataan?',
        answer: 'Filipino citizens aged 15 to 24 years old who have been residents of their barangay for at least six months can register as SK voters. To run for SK positions, candidates must be aged 18 to 24 years old, registered SK voters, and residents of the barangay for at least one year.'
      },
      {
        id: 'mem2',
        question: 'How can I register as an SK voter?',
        answer: 'To register as an SK voter, you need to visit your local COMELEC (Commission on Elections) office during the registration period with a valid ID that shows your age and residency. The registration process is usually announced several months before SK elections.'
      },
      {
        id: 'mem3',
        question: 'When are SK elections held?',
        answer: 'SK elections are typically held every three years. The specific dates are announced by the Commission on Elections (COMELEC). The last SK election was held in 2023, and the next one is scheduled for 2026.'
      }
    ],
    'Programs & Activities': [
      {
        id: 'prog1',
        question: 'What types of programs does the SK in Pasig implement?',
        answer: 'The SK in Pasig City implements various programs focused on youth development, including educational support (scholarships, academic recognition), sports activities, environmental initiatives, cultural preservation, leadership training, livelihood programs, and community service projects.'
      },
      {
        id: 'prog2',
        question: 'How can I participate in SK programs and events?',
        answer: 'You can participate in SK programs and events by following announcements on our official social media pages, contacting your local barangay SK council, or signing up on our website. Many programs are open to all youth residents, even if you\'re not an SK official.'
      },
      {
        id: 'prog3',
        question: 'Does the SK offer scholarships or educational assistance?',
        answer: 'Yes, the SK in Pasig City offers various forms of educational assistance, including merit-based scholarships, financial aid for underprivileged students, and academic recognition programs. Details and application procedures are announced on our website and social media channels.'
      },
      {
        id: 'prog4',
        question: 'Can we propose a youth program to the SK?',
        answer: 'Absolutely! The SK encourages youth initiatives. You can submit program proposals to your barangay SK council or directly to the SK Federation office. Proposals should include the program description, objectives, target participants, estimated budget, and expected outcomes.'
      }
    ],
    'Funding & Resources': [
      {
        id: 'fund1',
        question: 'How is the SK funded?',
        answer: "The SK receives 10% of the barangay's general fund as mandated by law. These funds are specifically allocated for youth development programs and activities. The SK also partners with public and private organizations for additional resources for specific projects."
      },
      {
        id: 'fund2',
        question: 'How does the SK ensure transparency in using funds?',
        answer: 'The SK practices transparency through regular financial reports submitted to the barangay council and the city government. All expenditures are documented and subject to audit by appropriate government agencies. Financial reports are also made available to the public upon request.'
      },
      {
        id: 'fund3',
        question: 'Can our organization partner with the SK for events?',
        answer: 'Yes, the SK welcomes partnerships with schools, NGOs, businesses, and other organizations for youth-focused events and programs. Please contact the SK Federation office or your local barangay SK council to discuss potential collaborations.'
      }
    ],
    'Volunteering': [
      {
        id: 'vol1',
        question: 'How can I volunteer for SK activities?',
        answer: 'You can volunteer by registering through our website or contacting your barangay SK council. We maintain a database of volunteers with different skills and interests, and we reach out when there are events or programs that match your profile.'
      },
      {
        id: 'vol2',
        question: 'What volunteer opportunities are available?',
        answer: 'Volunteer opportunities include event organizing, tutoring, environmental clean-ups, community outreach, social media management, graphic design, documentation, and specialized roles based on your skills and professional background.'
      },
      {
        id: 'vol3',
        question: 'Are there certificates or recognition for volunteers?',
        answer: 'Yes, the SK issues certificates of volunteer service that document your hours and contributions. Regular volunteers are also recognized during our annual youth awards ceremony. These certificates can be valuable additions to your resume or college applications.'
      }
    ]
  };

  // Function to toggle question expansion
  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Calculate the current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <YouthLayout>
      {/* Banner Section */}
      <section className="youth-faq-banner">
        <div className="youth-faq-banner-content">
          <h1 className="youth-faq-banner-text">Frequently Asked Questions</h1>
          <p className="youth-faq-banner-subtitle">Find answers to common questions about Sangguniang Kabataan Pasig</p>
        </div>
      </section>
      
      {/* Main Content */}
      <div className="youth-faq-content-wrapper">
        <div className="youth-faq-container">
          {/* FAQ Categories */}
          <div className="youth-faq-categories">
            {Object.keys(faqCategories).map((category) => (
              <button
                key={category}
                className={`youth-faq-category-btn ${activeCategory === category ? 'youth-faq-active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* FAQ Content */}
          <div className="youth-faq-content">
            <h2 className="youth-faq-section-title">{activeCategory} Questions</h2>
            
            <div className="youth-faq-list">
              {faqCategories[activeCategory].map((faq) => (
                <div key={faq.id} className="youth-faq-item">
                  <div 
                    className="youth-faq-question"
                    onClick={() => toggleQuestion(faq.id)}
                  >
                    <h3 className="youth-faq-question-text">{faq.question}</h3>
                    <div className="youth-faq-icon">
                      {expandedQuestions[faq.id] ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </div>
                  
                  {expandedQuestions[faq.id] && (
                    <div className="youth-faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Contact Section */}
        <div className="youth-faq-contact">
          <h2 className="youth-faq-contact-title">Still have questions?</h2>
          <p className="youth-faq-contact-text">If you couldn't find the answer to your question, please feel free to contact us directly</p>
          <div className="youth-faq-contact-buttons">
            <a href="mailto:sk@pasigcity.gov.ph" className="youth-btn youth-btn-primary">
              Email Us
            </a>
            <a href="/contact" className="youth-btn youth-btn-secondary">
              Contact Form
            </a>
          </div>
        </div>
      </div>
      
      {/* Chat Component */}
      <ChatComponent />
    </YouthLayout>
  );
};

export default FAQs;