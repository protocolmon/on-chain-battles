import { log, store, BigInt } from "@graphprotocol/graph-ts";
import {
  ERC721,
  Transfer as TransferEvent,
  NewEpochScheduled as NewEpochScheduledEvent,
  FulfillEpochRevealed as FulfillEpochRevealedEvent,
  RevealRequested as RevealRequestedEvent,
  Purchase as PurchaseEvent,
  Sale as SaleEvent,
} from "../generated/BondingCurveMons/ERC721";
import { LogEvent } from "../generated/EventLoggerV1/EventLoggerV1";
import {
  BattleEvent,
  Token,
  Wallet,
  Contract,
  Transfer,
  Epoch,
  EpochCounter,
  Transaction,
  SupplyDataPoint,
  HolderStatsData,
} from "../generated/schema";

const zeroAddress = "0x0000000000000000000000000000000000000000";

export function handleBattleEvent(event: LogEvent): void {
  let battleEvent = new BattleEvent(event.params.id.toHexString());
  battleEvent.action = event.params.action;
  battleEvent.data = event.params.data;
  battleEvent.timestamp = event.params.timestamp;
  battleEvent.player = event.params.player;
  battleEvent.opponent = event.params.opponent;
  battleEvent.monster = event.params.monster;
  battleEvent.opponentMonster = event.params.opponentMonster;
  battleEvent.round = event.params.round;
  battleEvent.save();
}

export function handleTransfer(event: TransferEvent): void {
  log.debug("Transfer detected. From: {} | To: {} | TokenID: {}", [
    event.params.from.toHexString(),
    event.params.to.toHexString(),
    event.params.tokenId.toHexString(),
  ]);

  let previousOwner = Wallet.load(event.params.from.toHexString());
  let newOwner = Wallet.load(event.params.to.toHexString());
  let token = Token.load(event.params.tokenId.toHexString());
  let transferId = event.transaction.hash
    .toHexString()
    .concat(":".concat(event.transactionLogIndex.toHexString()));
  let transfer = Transfer.load(transferId);
  let contract = Contract.load(event.address.toHexString());
  let instance = ERC721.bind(event.address);

  if (previousOwner == null) {
    previousOwner = new Wallet(event.params.from.toHexString());
    previousOwner.balance = BigInt.fromI32(0);
  } else if (previousOwner.balance != null) {
    previousOwner.balance = previousOwner.balance.minus(BigInt.fromI32(1));
  }

  if (newOwner == null) {
    newOwner = new Wallet(event.params.to.toHexString());
    newOwner.balance = BigInt.fromI32(1);
  } else if (newOwner.balance != null) {
    newOwner.balance = newOwner.balance.plus(BigInt.fromI32(1));
  }

  if (token == null) {
    token = new Token(event.params.tokenId.toHexString());
    token.contract = event.address.toHexString();
    token.minter = event.params.to.toHexString();
    let uri = instance.try_tokenURI(event.params.tokenId);

    if (!uri.reverted) {
      token.uri = uri.value;
    }
  }
  token.owner = event.params.to.toHexString();

  if (transfer == null) {
    transfer = new Transfer(transferId);
    transfer.token = event.params.tokenId.toHexString();
    transfer.from = event.params.from.toHexString();
    transfer.to = event.params.to.toHexString();
    transfer.timestamp = event.block.timestamp;
    transfer.block = event.block.number;
    transfer.transactionHash = event.transaction.hash.toHexString();
  }

  if (contract == null) {
    contract = new Contract(event.address.toHexString());
  }

  let name = instance.try_name();
  if (!name.reverted) {
    contract.name = name.value;
  }

  let symbol = instance.try_symbol();
  if (!symbol.reverted) {
    contract.symbol = symbol.value;
  }

  let totalSupply = instance.try_totalSupply();
  if (!totalSupply.reverted) {
    contract.totalSupply = totalSupply.value;
  }

  previousOwner.save();
  newOwner.save();
  token.save();
  contract.save();
  transfer.save();

  let holderStats = HolderStatsData.load("holderstats");
  if (holderStats == null) {
    holderStats = new HolderStatsData("holderstats");
    holderStats.total = BigInt.fromI32(0);
    holderStats.items1 = BigInt.fromI32(0);
    holderStats.items2_3 = BigInt.fromI32(0);
    holderStats.items4_10 = BigInt.fromI32(0);
    holderStats.items11_25 = BigInt.fromI32(0);
    holderStats.items26_50 = BigInt.fromI32(0);
    holderStats.items51 = BigInt.fromI32(0);
  }

  if (event.params.from.toHexString() == zeroAddress) {
    // Minting case: Increase total holders count and adjust item counts based on the new owner's balance post-mint.
    holderStats.total = holderStats.total.plus(BigInt.fromI32(1));

    let newOwnerTokenCountAfterMint =
      newOwner.balance != null ? newOwner.balance : BigInt.fromI32(0); // After mint, should be at least 1

    // Update item counts based on the new balance after minting.
    if (newOwnerTokenCountAfterMint.equals(BigInt.fromI32(1))) {
      holderStats.items1 = holderStats.items1.plus(BigInt.fromI32(1));
    } else if (newOwnerTokenCountAfterMint.equals(BigInt.fromI32(2))) {
      holderStats.items1 = holderStats.items1.minus(BigInt.fromI32(1));
      holderStats.items2_3 = holderStats.items2_3.plus(BigInt.fromI32(1));
    } else if (newOwnerTokenCountAfterMint.equals(BigInt.fromI32(4))) {
      holderStats.items2_3 = holderStats.items2_3.minus(BigInt.fromI32(1));
      holderStats.items4_10 = holderStats.items4_10.plus(BigInt.fromI32(1));
    } else if (newOwnerTokenCountAfterMint.equals(BigInt.fromI32(11))) {
      holderStats.items4_10 = holderStats.items4_10.minus(BigInt.fromI32(1));
      holderStats.items11_25 = holderStats.items11_25.plus(BigInt.fromI32(1));
    } else if (newOwnerTokenCountAfterMint.equals(BigInt.fromI32(26))) {
      holderStats.items11_25 = holderStats.items11_25.minus(BigInt.fromI32(1));
      holderStats.items26_50 = holderStats.items26_50.plus(BigInt.fromI32(1));
    } else if (newOwnerTokenCountAfterMint.equals(BigInt.fromI32(51))) {
      holderStats.items26_50 = holderStats.items26_50.minus(BigInt.fromI32(1));
      holderStats.items51 = holderStats.items51.plus(BigInt.fromI32(1));
    }
  } else if (event.params.to.toHexString() == zeroAddress) {
    // Burning case: Decrease total holders count and adjust item counts based on the previous owner's balance pre-burn.
    holderStats.total = holderStats.total.minus(BigInt.fromI32(1));

    let previousOwnerTokenCountAfterBurn =
      previousOwner.balance != null ? previousOwner.balance : BigInt.fromI32(0); // Before burn, should be at least 1

    // Update item counts based on the balance before burning.
    if (previousOwnerTokenCountAfterBurn.equals(BigInt.fromI32(0))) {
      holderStats.items1 = holderStats.items1.minus(BigInt.fromI32(1));
    } else if (previousOwnerTokenCountAfterBurn.equals(BigInt.fromI32(1))) {
      holderStats.items1 = holderStats.items1.plus(BigInt.fromI32(1));
      holderStats.items2_3 = holderStats.items2_3.minus(BigInt.fromI32(1));
    } else if (previousOwnerTokenCountAfterBurn.equals(BigInt.fromI32(3))) {
      holderStats.items2_3 = holderStats.items2_3.plus(BigInt.fromI32(1));
      holderStats.items4_10 = holderStats.items4_10.minus(BigInt.fromI32(1));
    } else if (previousOwnerTokenCountAfterBurn.equals(BigInt.fromI32(10))) {
      holderStats.items4_10 = holderStats.items4_10.plus(BigInt.fromI32(1));
      holderStats.items11_25 = holderStats.items11_25.minus(BigInt.fromI32(1));
    } else if (previousOwnerTokenCountAfterBurn.equals(BigInt.fromI32(25))) {
      holderStats.items11_25 = holderStats.items11_25.plus(BigInt.fromI32(1));
      holderStats.items26_50 = holderStats.items26_50.minus(BigInt.fromI32(1));
    } else if (previousOwnerTokenCountAfterBurn.equals(BigInt.fromI32(50))) {
      holderStats.items26_50 = holderStats.items26_50.plus(BigInt.fromI32(1));
      holderStats.items51 = holderStats.items51.minus(BigInt.fromI32(1));
    }
  } else {
    if (
      previousOwner.balance == BigInt.fromI32(0) &&
      newOwner.balance != null &&
      newOwner.balance > BigInt.fromI32(1)
    ) {
      // this means we lost a holder because the previous owner had only 1 token and the new
      // owner already was a holder
      holderStats.total = holderStats.total.minus(BigInt.fromI32(1));
    } else if (
      previousOwner.balance != null &&
      previousOwner.balance >= BigInt.fromI32(1) &&
      newOwner.balance == BigInt.fromI32(1)
    ) {
      // this means we gained a holder because the previous owner had more than 1 token and the new
      // owner only has 1 token
      holderStats.total = holderStats.total.plus(BigInt.fromI32(1));
    }

    // Decrement count for previous owner
    let previousOwnerTokenCount =
      previousOwner.balance != null ? previousOwner.balance : BigInt.fromI32(0);

    if (previousOwnerTokenCount.equals(BigInt.fromI32(1))) {
      // Previously had 2 tokens
      holderStats.items2_3 = holderStats.items2_3.minus(BigInt.fromI32(1));
      holderStats.items1 = holderStats.items1.plus(BigInt.fromI32(1));
    } else if (previousOwnerTokenCount.equals(BigInt.fromI32(3))) {
      // Previously had 4 tokens
      holderStats.items4_10 = holderStats.items4_10.minus(BigInt.fromI32(1));
      holderStats.items2_3 = holderStats.items2_3.plus(BigInt.fromI32(1));
    } else if (previousOwnerTokenCount.equals(BigInt.fromI32(10))) {
      // Previously had 11 tokens
      holderStats.items11_25 = holderStats.items11_25.minus(BigInt.fromI32(1));
      holderStats.items4_10 = holderStats.items4_10.plus(BigInt.fromI32(1));
    } else if (previousOwnerTokenCount.equals(BigInt.fromI32(25))) {
      // Previously had 26 tokens
      holderStats.items26_50 = holderStats.items26_50.minus(BigInt.fromI32(1));
      holderStats.items11_25 = holderStats.items11_25.plus(BigInt.fromI32(1));
    } else if (previousOwnerTokenCount.equals(BigInt.fromI32(50))) {
      // Previously had 51 tokens
      holderStats.items51 = holderStats.items51.minus(BigInt.fromI32(1));
      holderStats.items26_50 = holderStats.items26_50.plus(BigInt.fromI32(1));
    }

    // Increment count for new owner
    let newOwnerTokenCount =
      newOwner.balance != null ? newOwner.balance : BigInt.fromI32(0);

    if (newOwnerTokenCount.equals(BigInt.fromI32(2))) {
      // Previously had 1 token
      holderStats.items1 = holderStats.items1.minus(BigInt.fromI32(1));
      holderStats.items2_3 = holderStats.items2_3.plus(BigInt.fromI32(1));
    } else if (newOwnerTokenCount.equals(BigInt.fromI32(4))) {
      // Previously had 3 tokens
      holderStats.items2_3 = holderStats.items2_3.minus(BigInt.fromI32(1));
      holderStats.items4_10 = holderStats.items4_10.plus(BigInt.fromI32(1));
    } else if (newOwnerTokenCount.equals(BigInt.fromI32(11))) {
      // Previously had 10 tokens
      holderStats.items4_10 = holderStats.items4_10.minus(BigInt.fromI32(1));
      holderStats.items11_25 = holderStats.items11_25.plus(BigInt.fromI32(1));
    } else if (newOwnerTokenCount.equals(BigInt.fromI32(26))) {
      // Previously had 25 tokens
      holderStats.items11_25 = holderStats.items11_25.minus(BigInt.fromI32(1));
      holderStats.items26_50 = holderStats.items26_50.plus(BigInt.fromI32(1));
    } else if (newOwnerTokenCount.equals(BigInt.fromI32(51))) {
      // Previously had 50 tokens
      holderStats.items26_50 = holderStats.items26_50.minus(BigInt.fromI32(1));
      holderStats.items51 = holderStats.items51.plus(BigInt.fromI32(1));
    }
  }

  // Save updated entities
  previousOwner.save();
  newOwner.save();
  holderStats.save();

  // generate a new Transaction entity
  let transaction = new Transaction(event.transaction.hash.toHexString());

  transaction.save();
}

export function handleNewEpochScheduled(event: NewEpochScheduledEvent): void {
  // Use a constant ID for the EpochCounter since there will only be one instance.
  let counterId = "epoch-counter";
  let epochCounter = EpochCounter.load(counterId);

  if (epochCounter == null) {
    epochCounter = new EpochCounter(counterId);
    epochCounter.count = BigInt.fromI32(0); // Initialize the count
  }

  // Increment the count
  epochCounter.count = epochCounter.count.plus(BigInt.fromI32(1));
  epochCounter.save();

  // Now, create a new epoch entity using the incremented count
  let epoch = new Epoch(event.params.timestamp.toHexString());
  epoch.number = epochCounter.count;
  epoch.startBlock = event.block.number;
  epoch.timestamp = event.params.timestamp;
  epoch.tokenIds = new Array<BigInt>();
  epoch.save();

  // Generate a new Transaction entity
  let transaction = new Transaction(event.transaction.hash.toHexString());
  transaction.save();
}

export function handleFulfillEpochRevealed(
  event: FulfillEpochRevealedEvent,
): void {
  // we fetch the epoch entity
  let epoch = Epoch.load(event.params.timestamp.toHexString());

  if (epoch == null) {
    log.debug("Epoch not found: {}", [event.params.timestamp.toHexString()]);
    return;
  }

  // Update the epoch entity with new information
  epoch.endBlock = event.block.number;
  epoch.randomness = event.params.randomness;
  epoch.save();

  // Generate a new Transaction entity (assuming this is necessary for your logic)
  let transaction = new Transaction(event.transaction.hash.toHexString());
  transaction.save();

  // Assuming you have access to the contract instance to call `try_tokenURI`
  let instance = ERC721.bind(event.address);

  let tokenIds = epoch.tokenIds;

  if (tokenIds.length == 0) {
    log.debug("No tokens in epoch: {}", [epoch.id]);
    return;
  }

  for (let i = 0; i < tokenIds.length; i++) {
    let tokenId = tokenIds[i];
    let token = Token.load(tokenId.toHexString());

    if (token == null) {
      log.debug("Token not found: {}", [tokenId.toHexString()]);
      continue;
    }

    let ownerCallresult = instance.try_ownerOf(tokenId);
    if (!ownerCallresult.reverted) {
      token.opener = ownerCallresult.value.toHexString();
      token.save();
    } else {
      log.debug("Failed to fetch opener for token: {}", [token.id]);
    }

    // Fetch the new URI for each token
    let uriCallResult = instance.try_tokenURI(tokenId);
    if (!uriCallResult.reverted) {
      // Update the token URI if the call was successful
      token.uri = uriCallResult.value;
      token.save();
    } else {
      log.debug("Failed to fetch URI for token: {}", [token.id]);
    }
  }
}

export function handleRevealRequested(event: RevealRequestedEvent): void {
  // we fetch the epoch entity
  let epoch = Epoch.load(event.params.nextRevealTimestamp.toHexString());

  if (epoch == null) {
    log.debug("Epoch not found: {}", [
      event.params.nextRevealTimestamp.toHexString(),
    ]);
    return;
  }

  // add the token ID to the epoch entity
  let tokenIds = epoch.tokenIds;
  if (tokenIds == null) {
    tokenIds = new Array<BigInt>();
  }
  tokenIds.push(event.params.tokenId);
  epoch.tokenIds = tokenIds;
  epoch.save();

  // and we add it to the Token entity
  let token = Token.load(event.params.tokenId.toHexString());
  if (token == null) {
    log.debug("Token not found: {}", [event.params.tokenId.toHexString()]);
    return;
  }
  token.opener = token.owner;
  token.epoch = epoch.id;
  token.save();

  // generate a new Transaction entity
  let transaction = new Transaction(event.transaction.hash.toHexString());
  transaction.save();
}

export function handlePurchase(event: PurchaseEvent): void {
  // lets fetch the total supply
  let instance = ERC721.bind(event.address);
  let totalSupply = instance.try_totalSupply();

  if (totalSupply.reverted) {
    log.error("Failed to fetch total supply", []);
    return;
  }

  // create a supply data point
  let supply = new SupplyDataPoint(event.transaction.hash.toHexString());
  supply.timestamp = event.block.timestamp;
  supply.block = event.block.number;
  supply.totalSupply = totalSupply.value;
  supply.save();
}

export function handleSale(event: SaleEvent): void {
  // lets fetch the total supply
  let instance = ERC721.bind(event.address);
  let totalSupply = instance.try_totalSupply();

  if (totalSupply.reverted) {
    log.error("Failed to fetch total supply", []);
    return;
  }

  // create a supply data point
  let supply = new SupplyDataPoint(event.transaction.hash.toHexString());
  supply.timestamp = event.block.timestamp;
  supply.block = event.block.number;
  supply.totalSupply = totalSupply.value;
  supply.save();
}
