<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ChatBotResponse;

class ChatBotResponsesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $responses = [
            // Greetings
            [
                'trigger_keyword' => 'hello,hi,hey,greetings,good morning,good afternoon,good evening',
                'response' => 'Hello! I\'m SK Assist, the virtual assistant for the Sangguniang Kabataan of Pasig City. How can I help you today?',
                'category' => 'greeting',
                'priority' => 100,
                'is_active' => true
            ],
            [
                'trigger_keyword' => 'thank you,thanks,thank,appreciate',
                'response' => 'You\'re welcome! Is there anything else I can help you with?',
                'category' => 'greeting',
                'priority' => 90,
                'is_active' => true
            ],
            
            // Programs and Events
            [
                'trigger_keyword' => 'event,events,program,programs,activities,calendar',
                'response' => 'We have several youth programs and events coming up. You can check the calendar in the Programs & Events section for more details. Is there a specific type of event you\'re interested in?',
                'category' => 'event',
                'priority' => 80,
                'is_active' => true
            ],
            [
                'trigger_keyword' => 'scholarship,school,education',
                'response' => 'The SK Scholarship Program provides financial assistance to deserving students. Applications typically open in April-May each year. Would you like specific information about eligibility requirements?',
                'category' => 'program',
                'priority' => 75,
                'is_active' => true
            ],
            
            // Help and Contact
            [
                'trigger_keyword' => 'help,assistance,support,problem',
                'response' => 'I\'m here to help! You can ask about SK programs, events, policies, or submit feedback. If you need to speak with an SK officer directly, please let me know what your concern is about.',
                'category' => 'help',
                'priority' => 70,
                'is_active' => true
            ],
            [
                'trigger_keyword' => 'contact,phone,email,address,reach',
                'response' => 'You can contact the SK Federation Office at (02) 8643-1111 local 1700 or email sk@pasigcity.gov.ph. The office is located at the 7th Floor, Pasig City Hall, Caruncho Avenue, Pasig City.',
                'category' => 'contact',
                'priority' => 65,
                'is_active' => true
            ],
            
            // Policies and Templates
            [
                'trigger_keyword' => 'policy,policies,resolution,ordinance',
                'response' => 'You can find all SK policies and resolutions in the Youth Development Policies section. If you\'re looking for a specific policy, please provide more details.',
                'category' => 'policy',
                'priority' => 60,
                'is_active' => true
            ],
            [
                'trigger_keyword' => 'template,form,format,document',
                'response' => 'SK templates and forms are available in the Templates section. These include official forms, reports, and presentation templates. Do you need a specific type of document?',
                'category' => 'faq',
                'priority' => 55,
                'is_active' => true
            ],
            
            // General Info
            [
                'trigger_keyword' => 'sk,sangguniang kabataan,what is,about',
                'response' => 'The Sangguniang Kabataan (SK) is the youth council in the Philippines, representing young people aged 15-24 in each barangay. It implements programs addressing youth concerns and promotes youth development through various initiatives.',
                'category' => 'faq',
                'priority' => 50,
                'is_active' => true
            ],
            [
                'trigger_keyword' => 'age,requirement,qualify,join,member',
                'response' => 'To qualify for SK programs, you must be between 15-30 years old and a resident of Pasig City. Specific programs may have additional requirements. Would you like information about a particular program?',
                'category' => 'faq',
                'priority' => 45,
                'is_active' => true
            ],
            
            // Agent handover prompts
            [
                'trigger_keyword' => 'agent,human,person,officer,speak,talk,real person',
                'response' => 'I understand you\'d like to speak with an SK officer. Please describe your concern or question, and an available officer will respond as soon as possible.',
                'category' => 'other',
                'priority' => 95,
                'is_active' => true
            ],
            
            // Fallback responses
            [
                'trigger_keyword' => 'complain,complaint,report,issue,problem',
                'response' => 'I\'m sorry to hear you\'re experiencing an issue. To properly address your concern, please provide more details. An SK officer will review your complaint and respond shortly.',
                'category' => 'other',
                'priority' => 40,
                'is_active' => true
            ],
            [
                'trigger_keyword' => 'suggestion,idea,propose,recommendation',
                'response' => 'Thank you for your interest in contributing ideas! We value your suggestions. Please share your recommendation, and an SK officer will review it soon.',
                'category' => 'other',
                'priority' => 35,
                'is_active' => true
            ]
        ];
        
        foreach ($responses as $response) {
            ChatBotResponse::create($response);
        }
    }
}