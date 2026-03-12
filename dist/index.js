// src/index.ts
import { logger as logger2 } from "@elizaos/core";

// src/plugin.ts
import {
  ModelType,
  Service,
  logger
} from "@elizaos/core";
import { z } from "zod";
var configSchema = z.object({
  EXAMPLE_PLUGIN_VARIABLE: z.string().min(1, "Example plugin variable is not provided").optional().transform((val) => {
    if (!val) {
      console.warn("Warning: Example plugin variable is not provided");
    }
    return val;
  })
});
var helloWorldAction = {
  name: "HELLO_WORLD",
  similes: ["GREET", "SAY_HELLO"],
  description: "Responds with a simple hello world message",
  validate: async (_runtime, _message, _state) => {
    return true;
  },
  handler: async (_runtime, message, _state, _options, callback, _responses) => {
    try {
      logger.info("Handling HELLO_WORLD action");
      const responseContent = {
        text: "hello world!",
        actions: ["HELLO_WORLD"],
        source: message.content.source
      };
      await callback(responseContent);
      return {
        text: "Sent hello world greeting",
        values: {
          success: true,
          greeted: true
        },
        data: {
          actionName: "HELLO_WORLD",
          messageId: message.id,
          timestamp: Date.now()
        },
        success: true
      };
    } catch (error) {
      logger.error({ error }, "Error in HELLO_WORLD action:");
      return {
        text: "Failed to send hello world greeting",
        values: {
          success: false,
          error: "GREETING_FAILED"
        },
        data: {
          actionName: "HELLO_WORLD",
          error: error instanceof Error ? error.message : String(error)
        },
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you say hello?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "hello world!",
          actions: ["HELLO_WORLD"]
        }
      }
    ]
  ]
};
var helloWorldProvider = {
  name: "HELLO_WORLD_PROVIDER",
  description: "A simple example provider",
  get: async (_runtime, _message, _state) => {
    return {
      text: "I am a provider",
      values: {},
      data: {}
    };
  }
};

class StarterService extends Service {
  static serviceType = "starter";
  capabilityDescription = "This is a starter service which is attached to the agent through the starter plugin.";
  constructor(runtime) {
    super(runtime);
  }
  static async start(runtime) {
    logger.info("*** Starting starter service ***");
    const service = new StarterService(runtime);
    return service;
  }
  static async stop(runtime) {
    logger.info("*** Stopping starter service ***");
    const service = runtime.getService(StarterService.serviceType);
    if (!service) {
      throw new Error("Starter service not found");
    }
    service.stop();
  }
  async stop() {
    logger.info("*** Stopping starter service instance ***");
  }
}
var plugin = {
  name: "starter",
  description: "A starter plugin for Eliza",
  priority: -1000,
  config: {
    EXAMPLE_PLUGIN_VARIABLE: process.env.EXAMPLE_PLUGIN_VARIABLE
  },
  async init(config) {
    logger.info("*** Initializing starter plugin ***");
    try {
      const validatedConfig = await configSchema.parseAsync(config);
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value)
          process.env[key] = value;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues?.map((e) => e.message)?.join(", ") || "Unknown validation error";
        throw new Error(`Invalid plugin configuration: ${errorMessages}`);
      }
      throw new Error(`Invalid plugin configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
  models: {
    [ModelType.TEXT_SMALL]: async (_runtime, { prompt, stopSequences = [] }) => {
      return "Never gonna give you up, never gonna let you down, never gonna run around and desert you...";
    },
    [ModelType.TEXT_LARGE]: async (_runtime, {
      prompt,
      stopSequences = [],
      maxTokens = 8192,
      temperature = 0.7,
      frequencyPenalty = 0.7,
      presencePenalty = 0.7
    }) => {
      return "Never gonna make you cry, never gonna say goodbye, never gonna tell a lie and hurt you...";
    }
  },
  routes: [
    {
      name: "helloworld",
      path: "/helloworld",
      type: "GET",
      handler: async (_req, res) => {
        res.json({
          message: "Hello World!"
        });
      }
    }
  ],
  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        logger.info("MESSAGE_RECEIVED event received");
        logger.info({ keys: Object.keys(params) }, "MESSAGE_RECEIVED param keys");
      }
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        logger.info("VOICE_MESSAGE_RECEIVED event received");
        logger.info({ keys: Object.keys(params) }, "VOICE_MESSAGE_RECEIVED param keys");
      }
    ],
    WORLD_CONNECTED: [
      async (params) => {
        logger.info("WORLD_CONNECTED event received");
        logger.info({ keys: Object.keys(params) }, "WORLD_CONNECTED param keys");
      }
    ],
    WORLD_JOINED: [
      async (params) => {
        logger.info("WORLD_JOINED event received");
        logger.info({ keys: Object.keys(params) }, "WORLD_JOINED param keys");
      }
    ]
  },
  services: [StarterService],
  actions: [helloWorldAction],
  providers: [helloWorldProvider]
};
var plugin_default = plugin;

// src/character.ts
var character = {
  name: "ShieldTx",
  plugins: [
    "@elizaos/plugin-sql",
    ...process.env.ANTHROPIC_API_KEY?.trim() ? ["@elizaos/plugin-anthropic"] : [],
    ...process.env.ELIZAOS_API_KEY?.trim() ? ["@elizaos/plugin-elizacloud"] : [],
    ...process.env.OPENROUTER_API_KEY?.trim() ? ["@elizaos/plugin-openrouter"] : [],
    ...process.env.OPENAI_API_KEY?.trim() ? ["@elizaos/plugin-openai"] : [],
    ...process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ? ["@elizaos/plugin-google-genai"] : [],
    ...process.env.OLLAMA_API_ENDPOINT?.trim() ? ["@elizaos/plugin-ollama"] : [],
    ...process.env.DISCORD_API_TOKEN?.trim() ? ["@elizaos/plugin-discord"] : [],
    ...process.env.TWITTER_API_KEY?.trim() && process.env.TWITTER_API_SECRET_KEY?.trim() && process.env.TWITTER_ACCESS_TOKEN?.trim() && process.env.TWITTER_ACCESS_TOKEN_SECRET?.trim() ? ["@elizaos/plugin-twitter"] : [],
    ...process.env.TELEGRAM_BOT_TOKEN?.trim() ? ["@elizaos/plugin-telegram"] : [],
    ...!process.env.IGNORE_BOOTSTRAP ? ["@elizaos/plugin-bootstrap"] : []
  ],
  settings: {
    secrets: {},
    avatar: "https://elizaos.github.io/eliza-avatars/Eliza/portrait.png"
  },
  system: "Respond to all messages in a helpful, conversational manner. Provide assistance on a wide range of topics, using knowledge when needed. Be concise but thorough, friendly but professional. Use humor when appropriate and be empathetic to user needs. Provide valuable information and insights when questions are asked.",
  bio: [
    "Engages with all types of questions and conversations",
    "Provides helpful, concise responses",
    "Uses knowledge resources effectively when needed",
    "Balances brevity with completeness",
    "Uses humor and empathy appropriately",
    "Adapts tone to match the conversation context",
    "Offers assistance proactively",
    "Communicates clearly and directly"
  ],
  topics: [
    "general knowledge and information",
    "problem solving and troubleshooting",
    "technology and software",
    "community building and management",
    "business and productivity",
    "creativity and innovation",
    "personal development",
    "communication and collaboration",
    "education and learning",
    "entertainment and media"
  ],
  messageExamples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "This user keeps derailing technical discussions with personal problems."
        }
      },
      {
        name: "Eliza",
        content: {
          text: "DM them. Sounds like they need to talk about something else."
        }
      },
      {
        name: "{{name1}}",
        content: {
          text: "I tried, they just keep bringing drama back to the main channel."
        }
      },
      {
        name: "Eliza",
        content: {
          text: "Send them my way. I've got time today."
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "I can't handle being a mod anymore. It's affecting my mental health."
        }
      },
      {
        name: "Eliza",
        content: {
          text: "Drop the channels. You come first."
        }
      },
      {
        name: "{{name1}}",
        content: {
          text: "But who's going to handle everything?"
        }
      },
      {
        name: "Eliza",
        content: {
          text: "We will. Take the break. Come back when you're ready."
        }
      }
    ]
  ],
  style: {
    all: [
      "Keep responses concise but informative",
      "Use clear and direct language",
      "Be engaging and conversational",
      "Use humor when appropriate",
      "Be empathetic and understanding",
      "Provide helpful information",
      "Be encouraging and positive",
      "Adapt tone to the conversation",
      "Use knowledge resources when needed",
      "Respond to all types of questions"
    ],
    chat: [
      "Be conversational and natural",
      "Engage with the topic at hand",
      "Be helpful and informative",
      "Show personality and warmth"
    ]
  }
};

// src/plugins/sandwichDetection.ts
async function detectSandwichAttack(targetTx) {
  const mockMempool = [
    {
      hash: "0xaaa111",
      from: "0xBot1",
      to: "0xUniswap",
      value: BigInt("1000000000000000000"),
      gasPrice: BigInt("200000000000"),
      data: "0xswapdata"
    },
    {
      hash: targetTx,
      from: "0xVictim",
      to: "0xUniswap",
      value: BigInt("5000000000000000000"),
      gasPrice: BigInt("100000000000"),
      data: "0xswapdata"
    },
    {
      hash: "0xbbb222",
      from: "0xBot1",
      to: "0xUniswap",
      value: BigInt("1000000000000000000"),
      gasPrice: BigInt("50000000000"),
      data: "0xswapdata"
    }
  ];
  const targetIndex = mockMempool.findIndex((tx) => tx.hash === targetTx);
  if (targetIndex === -1)
    return "⚠️ Transaction not found in mempool.";
  const before = mockMempool.slice(0, targetIndex);
  const after = mockMempool.slice(targetIndex + 1);
  const sandwichers = before.filter((frontTx) => after.some((backTx) => backTx.from === frontTx.from && backTx.to === frontTx.to));
  if (sandwichers.length > 0) {
    return `\uD83D\uDEA8 SANDWICH ATTACK DETECTED!
      
Attacker: ${sandwichers[0].from}
Attack pattern: frontrun → your tx → backrun

\uD83D\uDEE1️ Recommendations:
  1. Use a private RPC (Flashbots Protect)
  2. Lower your slippage tolerance
  3. Use MEV Blocker: https://mevblocker.io`;
  }
  return `✅ No sandwich attack detected for tx: ${targetTx}
  
Your transaction appears safe to submit.`;
}
var sandwichDetectAction = {
  name: "DETECT_SANDWICH",
  description: "Detects sandwich attacks on a given transaction hash",
  similes: ["CHECK_SANDWICH", "SCAN_MEV", "PROTECT_TX", "CHECK_MEV"],
  validate: async (_runtime, message) => {
    const text = message.content.text ?? "";
    return /0x[a-fA-F0-9]{6,64}/.test(text);
  },
  handler: async (_runtime, message, _state, _options, callback) => {
    const text = message.content.text ?? "";
    const match = text.match(/0x[a-fA-F0-9]{6,64}/);
    const txHash = match ? match[0] : "0xUnknown";
    const result = await detectSandwichAttack(txHash);
    await callback?.({ text: result });
  },
  examples: [
    [
      {
        name: "user",
        content: { text: "Check this tx: 0xabc123def456" }
      },
      {
        name: "ShieldTx",
        content: { text: "\uD83D\uDEE1️ Scanning for sandwich attacks..." }
      }
    ]
  ]
};
var sandwichDetectionPlugin = {
  name: "sandwich-detection",
  description: "Detects MEV sandwich attacks on Ethereum transactions",
  actions: [sandwichDetectAction]
};

// src/index.ts
var initCharacter = ({ runtime }) => {
  logger2.info("Initializing character");
  logger2.info({ name: character.name }, "Name:");
};
var projectAgent = {
  character,
  init: async (runtime) => await initCharacter({ runtime }),
  plugins: [plugin_default, sandwichDetectionPlugin]
};
var project = {
  agents: [projectAgent]
};
var src_default = project;
export {
  projectAgent,
  src_default as default,
  character
};

//# debugId=1BA3ED190D10F8F064756E2164756E21
//# sourceMappingURL=index.js.map
