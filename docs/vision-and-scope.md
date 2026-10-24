# Vision and Scope

The service reads ERC-20 transfers from the chain. Anyone can see the latest transfers, and each wallet owner can see their own. It does not lose or duplicate records when it crashes or when the chain reorganizes. It is built entirely on Supabase: Edge Functions, Postgres with row-level policies, and sign-in by wallet signature.

## Actors and scenarios

| Actor              | Who it is                           | How it reaches the database        |
| ------------------ | ----------------------------------- | ---------------------------------- |
| Visitor            | anyone, not signed in               | publishable key, under policies    |
| Wallet owner       | a person signed in with a signature | publishable key, under policies    |
| Indexer            | a function on a schedule            | secret key, bypasses policies      |
| Queue worker       | a function that handles messages    | secret key, bypasses policies      |
| Public entry point | export and notifications            | by task: user token or service key |

Main scenarios:

1. **Feed.** A visitor opens the site without signing in. They see the latest transfers of the listed tokens and how far the indexer is behind the chain.
2. **Sign-in.** The user signs a message with their wallet. They get a session, and the wallet address goes into the token.
3. **History.** The user opens the list of their own transfers from the last 30 days. Each row shows the amount, the date and a link to the explorer.
4. **Live transfer.** While the page is open, a new transfer appears by itself. The user does not reload the page.
5. **Export.** The user asks for their history over a period. They get a link to a CSV file, and the link expires.
6. **Catch-up.** The service was off for a day. On start it reads what it missed and creates no duplicates.
7. **Reorg.** Some blocks were replaced. The service rolls back the affected records and reads the new branch.

Nobody sees the last two scenarios. They decide whether the screen can be trusted.

## Functional requirements

| Group                 | №     | Requirement                                                                          |
| --------------------- | ----- | ------------------------------------------------------------------------------------ |
| Indexing              | FR-1  | Read `Transfer` events of the listed ERC-20 contracts                                |
| Indexing              | FR-2  | Decode an event into sender, receiver and amount                                     |
| Indexing              | FR-3  | Store a transfer with a unique key of `(tx_hash, log_index)`                         |
| Indexing              | FR-4  | Set the network and the contracts by configuration, with no code changes             |
| Catch-up and schedule | FR-5  | Continue from the saved position after a stop                                        |
| Catch-up and schedule | FR-6  | Catch up in ranges that respect the provider limits                                  |
| Catch-up and schedule | FR-7  | Run on a schedule, with no long-running process                                      |
| Catch-up and schedule | FR-8  | Handle an event through a queue, with a retry on failure                             |
| Chain consistency     | FR-9  | Do not treat a record as final before the set number of confirmations                |
| Chain consistency     | FR-10 | Detect a replaced branch and roll back the affected records                          |
| Storage               | FR-11 | Keep transfers for a number of days set in the database, remove older ones every day |
| Access                | FR-12 | Sign the user in by a wallet signature                                               |
| Access                | FR-13 | Let anyone read transfers, and a client read only their own exports                  |
| Dashboard             | FR-14 | Show the latest transfers and the indexer status without sign-in                     |
| Dashboard             | FR-15 | Show a signed-in user the transfers of their address, with a token filter            |
| Dashboard             | FR-16 | Deliver a new transfer to an open page without a reload                              |
| Dashboard             | FR-17 | Return own history for a period as a file behind a link that expires                 |
| Optional              | FR-18 | Send a notification about an incoming transfer to an external channel                |
| Optional              | FR-19 | Index ERC-721 and cache token images                                                 |
| Optional              | FR-20 | Connect a wallet and sign a transaction from the interface                           |
| Optional              | FR-21 | Keep the full history of signed-in wallets, beyond the window                        |

## Non-functional requirements

Each one is written so that it can fail a check. Otherwise it is a wish, not a requirement.

| Group          | №      | Requirement                                    | How to check                                                         |
| -------------- | ------ | ---------------------------------------------- | -------------------------------------------------------------------- |
| Data integrity | NFR-1  | Running the same work twice changes nothing    | run twice on one range, the row count stays the same                 |
| Data integrity | NFR-2  | A stop at any moment leaves no gaps            | break the catch-up, start again, compare the block range             |
| Data integrity | NFR-3  | Position and data move together                | records and the new position are written in one database transaction |
| Data integrity | NFR-4  | Parallel runs do not break the position        | start two passes at once, the second one backs off on the lock       |
| Data integrity | NFR-5  | Records match the chain after a reorg          | change a block hash by hand, see the rollback                        |
| Access control | NFR-6  | A client cannot read other people's exports    | a second wallet in another browser gets an empty list of exports     |
| Access control | NFR-7  | A client cannot call service operations        | a call to the service procedure from the browser is rejected         |
| Access control | NFR-8  | The secret key never leaves the server side    | a search in the built interface finds no secret key prefix           |
| Operations     | NFR-9  | History queries hold up on large data          | the query plan uses an index at one million rows                     |
| Operations     | NFR-10 | Changing the RPC provider needs no code change | the provider comes from an environment variable                      |
| Operations     | NFR-11 | A temporary link stops working when it expires | open the link after it expires                                       |
| Operations     | NFR-12 | Stored transfers stay within the window        | after the daily cleanup, no transfer is older than the window        |

## Limits

- The native coin is not tracked: ETH transfers emit no log events
- History covers a window of recent days, not the whole life of a token
- One network at a time; the network and the contract list come from configuration
- The service never writes to the chain — it only reads, and it holds no private keys
