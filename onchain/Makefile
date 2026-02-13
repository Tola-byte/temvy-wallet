# ==========================================
# CONFIG
# ==========================================

RPC_URL ?= $(TEMPO_RPC_URL)

CONTRACT = src/Currency.sol:StableToken

NAME = "Invisible U"
SYM = "iUSD"
CUR = "USD"

QUOTE = 0x20C0000000000000000000000000000000000000
ADMIN = 0xF554609524Ae96f40dBC06414d409b4ddeeB1980

VERIFIER_URL = https://contracts.tempo.xyz/api

# ==========================================
# COMMANDS
# ==========================================

deploy:
	forge create $(CONTRACT) \
		--rpc-url $(RPC_URL) \
		--interactive \
		--broadcast \
		--verify \
		--verifier blockscout \
		--verifier-url $(VERIFIER_URL) \
		--constructor-args $(NAME) $(SYM) $(CUR) $(QUOTE) $(ADMIN) $(ADMIN) \
		--retries 10 \
		--delay 10

build:
	forge build

clean:
	forge clean

test:
	forge test -vvv
