<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * @return void
     */
    public function up()
    {
        // Create chat conversations table
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->nullable()->constrained('accounts')->onDelete('cascade');
            $table->boolean('is_anonymous')->default(false);
            $table->enum('status', ['active', 'pending', 'resolved', 'closed'])->default('active');
            $table->enum('category', ['inquiry', 'complaint', 'suggestion', 'technical', 'other'])->default('inquiry');
            $table->string('subject')->nullable();
            $table->foreignId('assigned_sk_id')->nullable()->constrained('skaccounts')->onDelete('set null');
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Create chat messages table
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('chat_conversations')->onDelete('cascade');
            $table->text('message');
            $table->enum('sender_type', ['user', 'bot', 'agent']);
            $table->foreignId('sender_id')->nullable(); // Account ID or SK account ID
            $table->boolean('is_read')->default(false);
            $table->json('attachments')->nullable();
            $table->timestamps();
        });

        // Create canned responses table
        Schema::create('canned_responses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->enum('category', ['greeting', 'inquiry', 'complaint', 'suggestion', 'technical', 'closing', 'other']);
            $table->foreignId('created_by')->constrained('skaccounts')->onDelete('cascade');
            $table->boolean('is_public')->default(true);
            $table->timestamps();
        });

        // Create chat bot responses table
        Schema::create('chat_bot_responses', function (Blueprint $table) {
            $table->id();
            $table->string('trigger_keyword');
            $table->text('response');
            $table->enum('category', ['faq', 'greeting', 'help', 'event', 'program', 'policy', 'contact', 'other']);
            $table->integer('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Create feedback analytics table for caching analytics data
        Schema::create('feedback_analytics', function (Blueprint $table) {
            $table->id();
            $table->string('metric_name');
            $table->string('period'); // daily, weekly, monthly, yearly
            $table->date('date');
            $table->json('data');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     * 
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('feedback_analytics');
        Schema::dropIfExists('chat_bot_responses');
        Schema::dropIfExists('canned_responses');
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_conversations');
    }
};