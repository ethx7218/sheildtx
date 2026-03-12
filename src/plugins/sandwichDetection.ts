import { Plugin, Action, IAgentRuntime, Memory } from "@elizaos/core";

// Simulated mempool transaction type
interface MempoolTx {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  gasPrice: bigint;
  data: string;
}

// Core sandwich detection logic
async function detectSandwichAttack(targetTx: string): Promise<string> {
  // In production, replace with real mempool data
  // e.g. via Flashbots, BloxRoute, or Alchemy Mempool API
  const mockMempool: MempoolTx[] = [
    {
      hash: "0xaaa111",
      from: "0xBot1",
      to: "0xUniswap",
      value: BigInt("1000000000000000000"),
      gasPrice: BigInt("200000000000"), // higher gas = frontrun
      data: "0xswapdata",
    },
    {
      hash: targetTx,
      from: "0xVictim",
      to: "0xUniswap",
      value: BigInt("5000000000000000000"),
      gasPrice: BigInt("100000000000"),
      data: "0xswapdata",
    },
    {
      hash: "0xbbb222",
      from: "0xBot1", // same bot = sandwich!
      to: "0xUniswap",
      value: BigInt("1000000000000000000"),
      gasPrice: BigInt("50000000000"), // lower gas = backrun
      data: "0xswapdata",
    },
  ];

  // Detection: same address appears before AND after target tx
  const targetIndex = mockMempool.findIndex((tx) => tx.hash === targetTx);
  if (targetIndex === -1) return "⚠️ Transaction not found in mempool.";

  const before = mockMempool.slice(0, targetIndex);
  const after = mockMempool.slice(targetIndex + 1);

  const sandwichers = before.filter((frontTx) =>
    after.some(
      (backTx) =>
        backTx.from === frontTx.from && // same attacker
        backTx.to === frontTx.to // same target contract
    )
  );

  if (sandwichers.length > 0) {
    return `🚨 SANDWICH ATTACK DETECTED!
      
Attacker: ${sandwichers[0].from}
Attack pattern: frontrun → your tx → backrun

🛡️ Recommendations:
  1. Use a private RPC (Flashbots Protect)
  2. Lower your slippage tolerance
  3. Use MEV Blocker: https://mevblocker.io`;
  }

  return `✅ No sandwich attack detected for tx: ${targetTx}
  
Your transaction appears safe to submit.`;
}

// ElizaOS Action
const sandwichDetectAction: Action = {
  name: "DETECT_SANDWICH",
  description: "Detects sandwich attacks on a given transaction hash",
  similes: ["CHECK_SANDWICH", "SCAN_MEV", "PROTECT_TX", "CHECK_MEV"],

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text ?? "";
    // Trigger if message contains a tx hash (0x + 64 hex chars)
    return /0x[a-fA-F0-9]{6,64}/.test(text);
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state,
    _options,
    callback
  ) => {
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
        content: { text: "Check this tx: 0xabc123def456" },
      },
      {
        name: "ShieldTx",
        content: { text: "🛡️ Scanning for sandwich attacks..." },
      },
    ],
  ],
};

// Export plugin
export const sandwichDetectionPlugin: Plugin = {
  name: "sandwich-detection",
  description: "Detects MEV sandwich attacks on Ethereum transactions",
  actions: [sandwichDetectAction],
};
