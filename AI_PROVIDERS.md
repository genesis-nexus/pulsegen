# AI Provider Guide

PulseGen supports multiple AI providers, giving you the flexibility to choose the best model for your needs and budget. Users can bring their own API keys and switch between providers.

## Supported Providers

### 1. OpenAI (GPT-4, GPT-3.5)
**Best for**: General-purpose survey creation and analysis

- **Models**: gpt-4-turbo-preview (recommended), gpt-4, gpt-3.5-turbo
- **Get API Key**: https://platform.openai.com/api-keys
- **Pricing**: Pay per token (see OpenAI pricing)
- **Features**:
  - Excellent at survey generation
  - Strong analytical capabilities
  - Fast response times
  - JSON mode support

### 2. Anthropic (Claude)
**Best for**: Deep analysis and nuanced insights

- **Models**: claude-sonnet-4-20250514 (recommended), claude-haiku-4-20250514, claude-opus-4-20250514
- **Get API Key**: https://console.anthropic.com/
- **Pricing**: Pay per token (see Anthropic pricing)
- **Features**:
  - Superior reasoning abilities
  - Excellent for complex analysis
  - Great at understanding context
  - Strong at following instructions

### 3. Google (Gemini)
**Best for**: Cost-effective option with good performance

- **Models**: gemini-pro (recommended), gemini-pro-vision
- **Get API Key**: https://makersuite.google.com/app/apikey
- **Pricing**: Free tier available, then pay per token
- **Features**:
  - Good balance of cost and performance
  - Fast inference
  - Generous free tier
  - Multimodal support

### 4. Azure OpenAI
**Best for**: Enterprise deployments with Azure infrastructure

- **Models**: gpt-4, gpt-35-turbo (deployment-specific)
- **Setup**: Requires Azure subscription and OpenAI service
- **Endpoint**: Custom Azure endpoint URL required
- **Features**:
  - Enterprise-grade security
  - SLA guarantees
  - Regional deployment options
  - Integration with Azure services

## Adding an AI Provider

### Through the UI (Recommended)

1. **Navigate to AI Settings**
   - Click "AI Settings" in the navigation bar
   - Or go to `/settings/ai`

2. **Click "Add Provider"**

3. **Select Provider**
   - Choose from OpenAI, Anthropic, Google, or Azure OpenAI

4. **Enter API Key**
   - Paste your API key from the provider's console
   - API keys are encrypted before storage

5. **Optional: Configure Model**
   - Select a specific model or use the default
   - Different models have different capabilities and costs

6. **Optional: Set as Default**
   - Check "Set as default provider" to use this provider by default
   - You can change the default later

7. **Save**

### Through Environment Variables (System-wide)

For system administrators who want to provide default AI access:

```bash
# In .env file
ENCRYPTION_KEY=your-64-character-hex-encryption-key

# Optional: System default API keys (users can override)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key
```

**Note**: Environment variables provide system-wide defaults, but users can still add their own API keys through the UI.

## API Key Security

- **Encryption**: All API keys are encrypted using AES-256-GCM before storage
- **No Exposure**: API keys are never exposed in API responses
- **User-Specific**: Each user manages their own API keys
- **Secure Transmission**: HTTPS/TLS encryption in transit

## Choosing the Right Provider

### For Survey Generation
- **OpenAI GPT-4**: Best overall quality
- **Claude Sonnet**: Most creative and context-aware
- **Gemini Pro**: Best value for money

### For Response Analysis
- **Claude Sonnet/Opus**: Superior analytical depth
- **OpenAI GPT-4**: Strong general analysis
- **Gemini Pro**: Good for basic analysis

### For High Volume
- **Gemini Pro**: Best free tier
- **GPT-3.5 Turbo**: Fastest and cheapest OpenAI option
- **Claude Haiku**: Fastest Anthropic option

### For Enterprise
- **Azure OpenAI**: Enterprise SLAs and compliance
- **Self-hosted**: Consider Hugging Face models (coming soon)

## Cost Optimization Tips

1. **Use Appropriate Models**
   - Use lighter models (gpt-3.5-turbo, claude-haiku, gemini-pro) for simple tasks
   - Reserve powerful models (gpt-4, claude-opus) for complex analysis

2. **Set Default Provider**
   - Set your most cost-effective provider as default
   - Override for specific tasks that need more power

3. **Cache Results**
   - PulseGen automatically caches AI responses for 1 hour
   - Repeated queries use cached results (no additional cost)

4. **Monitor Usage**
   - Check your provider's dashboard for usage statistics
   - Set up billing alerts on the provider's platform

## Switching Providers

You can switch providers at any time:

1. **Add New Provider**
   - Add the new provider's API key in AI Settings

2. **Set as Default** (Optional)
   - Make the new provider your default

3. **Remove Old Provider** (Optional)
   - Delete the old provider if no longer needed

## Provider Comparison

| Feature | OpenAI | Anthropic | Google | Azure OpenAI |
|---------|--------|-----------|--------|--------------|
| Free Tier | Trial credits | Trial credits | Yes (generous) | No |
| Best Model | GPT-4 Turbo | Claude Opus | Gemini Pro | GPT-4 |
| Speed | Fast | Fast | Very Fast | Fast |
| Context Window | 128K | 200K | 32K | 128K |
| JSON Mode | Yes | No (prompting) | No (prompting) | Yes |
| Pricing | $$$ | $$$ | $ | $$$ |
| Enterprise SLA | No | Yes | Yes | Yes |

## Troubleshooting

### "No AI provider configured"
- Add an API key in AI Settings

### "Invalid API key"
- Verify your API key is correct
- Check if the key has expired
- Ensure the key has proper permissions

### "Rate limit exceeded"
- Your provider's rate limit was hit
- Wait and try again
- Upgrade your provider plan
- Switch to a different provider

### "AI features not working"
- Check that you have at least one active provider
- Verify your API key is valid
- Check your provider's status page

## Future Providers (Roadmap)

- **Cohere**: Command models for embeddings and generation
- **Hugging Face**: Self-hosted open-source models
- **Custom OpenAI-Compatible**: Any OpenAI-compatible API
- **Ollama**: Local models for complete privacy

## API Documentation

### List Available Providers
```http
GET /api/ai/providers/available
```

### List Your Configured Providers
```http
GET /api/ai/providers
```

### Add Provider
```http
POST /api/ai/providers
Content-Type: application/json

{
  "provider": "OPENAI",
  "apiKey": "sk-...",
  "modelName": "gpt-4-turbo-preview",
  "isDefault": true
}
```

### Update Provider
```http
PUT /api/ai/providers/:provider
Content-Type: application/json

{
  "isDefault": true
}
```

### Delete Provider
```http
DELETE /api/ai/providers/:provider
```

## Support

For provider-specific issues:
- **OpenAI**: https://help.openai.com
- **Anthropic**: https://support.anthropic.com
- **Google AI**: https://ai.google.dev/support

For PulseGen integration issues:
- GitHub Issues: <repository-url>/issues
