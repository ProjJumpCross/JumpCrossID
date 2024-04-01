import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const JCIDModule = buildModule("JCIDModule", (m) => {
  const owner = m.getAccount(0);
  const defaultTokenURI = "ipfs://QmWderTZk6hezjcPui4Ft68Kbtxw3HvvAijEWtCHPUdHE2"

  const jcidModule = m.contract("JumpCrossID", [owner, defaultTokenURI]);

  return { jcidModule };
});

export default JCIDModule;
