import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
if (typeof window !== "undefined") {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CBEATCI7U6L4LKPU57J7AZT4U2YF6KDMVG6QEVWGXF2X6ZZKOBGQLE5L",
    }
};
export const Errors = {
    1: { message: "OnlyOwner" },
    2: { message: "InactiveBounty" },
    3: { message: "BountyDeadlinePassed" },
    4: { message: "BountyNotFound" },
    5: { message: "SubmissionNotFound" },
    6: { message: "JudgingDeadlinePassed" },
    7: { message: "DistributionMustSumTo100" },
    8: { message: "CannotSelectWinnersBeforeSubmissionDeadline" },
    9: { message: "JudgingDeadlineMustBeAfterSubmissionDeadline" },
    10: { message: "NotEnoughWinners" },
    11: { message: "InternalError" },
    12: { message: "NotAdmin" },
    13: { message: "AdminCannotBeZero" },
    14: { message: "FeeAccountCannotBeZero" },
    15: { message: "SameFeeAccount" },
    16: { message: "BountyHasSubmissions" },
    17: { message: "InvalidDeadlineUpdate" },
    18: { message: "InvalidReward" }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { admin, fee_account }, 
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy({ admin, fee_account }, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAAAAAAAAKZ2V0X2JvdW50eQAAAAAAAQAAAAAAAAAJYm91bnR5X2lkAAAAAAAABAAAAAEAAAPpAAAH0AAAAAZCb3VudHkAAAAAAAM=",
            "AAAAAAAAAAAAAAAMY2xvc2VfYm91bnR5AAAAAgAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAlib3VudHlfaWQAAAAAAAAEAAAAAQAAA+kAAAPtAAAAAAAAAAM=",
            "AAAAAAAAAAAAAAAMZ2V0X2JvdW50aWVzAAAAAAAAAAEAAAPqAAAABA==",
            "AAAAAAAAAAAAAAAMdXBkYXRlX2FkbWluAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAEAAAPpAAAAEwAAAAM=",
            "AAAAAAAAAAAAAAANY2hlY2tfanVkZ2luZwAAAAAAAAEAAAAAAAAACWJvdW50eV9pZAAAAAAAAAQAAAABAAAD6QAAA+0AAAAAAAAAAw==",
            "AAAAAAAAAAAAAAANY3JlYXRlX2JvdW50eQAAAAAAAAcAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAZyZXdhcmQAAAAAAAsAAAAAAAAADGRpc3RyaWJ1dGlvbgAAA+oAAAPtAAAAAgAAAAQAAAAEAAAAAAAAABNzdWJtaXNzaW9uX2RlYWRsaW5lAAAAAAYAAAAAAAAAEGp1ZGdpbmdfZGVhZGxpbmUAAAAGAAAAAAAAAAV0aXRsZQAAAAAAABAAAAABAAAD6QAAAAQAAAAD",
            "AAAAAAAAAAAAAAANZGVsZXRlX2JvdW50eQAAAAAAAAIAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAJYm91bnR5X2lkAAAAAAAABAAAAAEAAAPpAAAD7QAAAAAAAAAD",
            "AAAAAAAAAAAAAAANdXBkYXRlX2JvdW50eQAAAAAAAAUAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAJYm91bnR5X2lkAAAAAAAABAAAAAAAAAAJbmV3X3RpdGxlAAAAAAAD6AAAABAAAAAAAAAAEG5ld19kaXN0cmlidXRpb24AAAPqAAAD7QAAAAIAAAAEAAAABAAAAAAAAAAXbmV3X3N1Ym1pc3Npb25fZGVhZGxpbmUAAAAD6AAAAAYAAAABAAAD6QAAA+0AAAAAAAAAAw==",
            "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAALZmVlX2FjY291bnQAAAAAEwAAAAA=",
            "AAAAAAAAAAAAAAAOZ2V0X3N1Ym1pc3Npb24AAAAAAAIAAAAAAAAACWJvdW50eV9pZAAAAAAAAAQAAAAAAAAABHVzZXIAAAATAAAAAQAAA+kAAAAQAAAAAw==",
            "AAAAAAAAAAAAAAAOc2VsZWN0X3dpbm5lcnMAAAAAAAMAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAJYm91bnR5X2lkAAAAAAAABAAAAAAAAAAHd2lubmVycwAAAAPqAAAAEwAAAAEAAAPpAAAD7QAAAAAAAAAD",
            "AAAAAAAAAAAAAAAPYXBwbHlfdG9fYm91bnR5AAAAAAMAAAAAAAAACWFwcGxpY2FudAAAAAAAABMAAAAAAAAACWJvdW50eV9pZAAAAAAAAAQAAAAAAAAAD3N1Ym1pc3Npb25fbGluawAAAAAQAAAAAQAAA+kAAAPtAAAAAAAAAAM=",
            "AAAAAAAAAAAAAAARZ2V0X2JvdW50eV9zdGF0dXMAAAAAAAABAAAAAAAAAAlib3VudHlfaWQAAAAAAAAEAAAAAQAAA+kAAAfQAAAABlN0YXR1cwAAAAAAAw==",
            "AAAAAAAAAAAAAAARZ2V0X3VzZXJfYm91bnRpZXMAAAAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPqAAAABA==",
            "AAAAAAAAAAAAAAARdXBkYXRlX3N1Ym1pc3Npb24AAAAAAAADAAAAAAAAAAlhcHBsaWNhbnQAAAAAAAATAAAAAAAAAAlib3VudHlfaWQAAAAAAAAEAAAAAAAAABNuZXdfc3VibWlzc2lvbl9saW5rAAAAABAAAAABAAAD6QAAA+0AAAAAAAAAAw==",
            "AAAAAAAAAAAAAAASZ2V0X2JvdW50aWVzX2NvdW50AAAAAAAAAAAAAQAAAAQ=",
            "AAAAAAAAAAAAAAASZ2V0X2JvdW50eV93aW5uZXJzAAAAAAABAAAAAAAAAAlib3VudHlfaWQAAAAAAAAEAAAAAQAAA+kAAAPqAAAAEwAAAAM=",
            "AAAAAAAAAAAAAAASZ2V0X293bmVyX2JvdW50aWVzAAAAAAABAAAAAAAAAAVvd25lcgAAAAAAABMAAAABAAAD6gAAAAQ=",
            "AAAAAAAAAAAAAAASdXBkYXRlX2ZlZV9hY2NvdW50AAAAAAABAAAAAAAAAA9uZXdfZmVlX2FjY291bnQAAAAAEwAAAAEAAAPpAAAAEwAAAAM=",
            "AAAAAAAAAAAAAAATZ2V0X2FjdGl2ZV9ib3VudGllcwAAAAAAAAAAAQAAA+oAAAAE",
            "AAAAAAAAAAAAAAAVZ2V0X2JvdW50aWVzX2J5X3Rva2VuAAAAAAAAAQAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAQAAA+oAAAAE",
            "AAAAAAAAAAAAAAAVZ2V0X2JvdW50eV9hcHBsaWNhbnRzAAAAAAAAAQAAAAAAAAAJYm91bnR5X2lkAAAAAAAABAAAAAEAAAPpAAAD6gAAABMAAAAD",
            "AAAAAAAAAAAAAAAWZ2V0X2JvdW50aWVzX2J5X3N0YXR1cwAAAAAAAQAAAAAAAAAGc3RhdHVzAAAAAAfQAAAABlN0YXR1cwAAAAAAAQAAA+oAAAAE",
            "AAAAAAAAAAAAAAAWZ2V0X2JvdW50eV9zdWJtaXNzaW9ucwAAAAAAAQAAAAAAAAAJYm91bnR5X2lkAAAAAAAABAAAAAEAAAPpAAAD7AAAABMAAAAQAAAAAw==",
            "AAAAAAAAAAAAAAAXZ2V0X3VzZXJfYm91bnRpZXNfY291bnQAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAABA==",
            "AAAAAAAAAAAAAAAYZ2V0X293bmVyX2JvdW50aWVzX2NvdW50AAAAAQAAAAAAAAAFb3duZXIAAAAAAAATAAAAAQAAAAQ=",
            "AAAAAAAAAAAAAAAbZ2V0X2JvdW50aWVzX2J5X3Rva2VuX2NvdW50AAAAAAEAAAAAAAAABXRva2VuAAAAAAAAEwAAAAEAAAAE",
            "AAAAAAAAAAAAAAAcZ2V0X2JvdW50aWVzX2J5X3N0YXR1c19jb3VudAAAAAEAAAAAAAAABnN0YXR1cwAAAAAH0AAAAAZTdGF0dXMAAAAAAAEAAAAE",
            "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAEgAAAAAAAAAJT25seU93bmVyAAAAAAAAAQAAAAAAAAAOSW5hY3RpdmVCb3VudHkAAAAAAAIAAAAAAAAAFEJvdW50eURlYWRsaW5lUGFzc2VkAAAAAwAAAAAAAAAOQm91bnR5Tm90Rm91bmQAAAAAAAQAAAAAAAAAElN1Ym1pc3Npb25Ob3RGb3VuZAAAAAAABQAAAAAAAAAVSnVkZ2luZ0RlYWRsaW5lUGFzc2VkAAAAAAAABgAAAAAAAAAYRGlzdHJpYnV0aW9uTXVzdFN1bVRvMTAwAAAABwAAAAAAAAArQ2Fubm90U2VsZWN0V2lubmVyc0JlZm9yZVN1Ym1pc3Npb25EZWFkbGluZQAAAAAIAAAAAAAAACxKdWRnaW5nRGVhZGxpbmVNdXN0QmVBZnRlclN1Ym1pc3Npb25EZWFkbGluZQAAAAkAAAAAAAAAEE5vdEVub3VnaFdpbm5lcnMAAAAKAAAAAAAAAA1JbnRlcm5hbEVycm9yAAAAAAAACwAAAAAAAAAITm90QWRtaW4AAAAMAAAAAAAAABFBZG1pbkNhbm5vdEJlWmVybwAAAAAAAA0AAAAAAAAAFkZlZUFjY291bnRDYW5ub3RCZVplcm8AAAAAAA4AAAAAAAAADlNhbWVGZWVBY2NvdW50AAAAAAAPAAAAAAAAABRCb3VudHlIYXNTdWJtaXNzaW9ucwAAABAAAAAAAAAAFUludmFsaWREZWFkbGluZVVwZGF0ZQAAAAAAABEAAAAAAAAADUludmFsaWRSZXdhcmQAAAAAAAAS",
            "AAAAAQAAAAAAAAAAAAAABkJvdW50eQAAAAAACwAAAAAAAAAKYXBwbGljYW50cwAAAAAD6gAAABMAAAAAAAAADGRpc3RyaWJ1dGlvbgAAA+wAAAAEAAAABAAAAAAAAAAQanVkZ2luZ19kZWFkbGluZQAAAAYAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAGcmV3YXJkAAAAAAALAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAAGU3RhdHVzAAAAAAAAAAAAE3N1Ym1pc3Npb25fZGVhZGxpbmUAAAAABgAAAAAAAAALc3VibWlzc2lvbnMAAAAD7AAAABMAAAAQAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAHd2lubmVycwAAAAPqAAAAEw==",
            "AAAAAgAAAAAAAAAAAAAABlN0YXR1cwAAAAAAAwAAAAAAAAAAAAAABkFjdGl2ZQAAAAAAAAAAAAAAAAAJQ29tcGxldGVkAAAAAAAAAAAAAAAAAAAGQ2xvc2VkAAA="]), options);
        this.options = options;
    }
    fromJSON = {
        get_bounty: (this.txFromJSON),
        close_bounty: (this.txFromJSON),
        get_bounties: (this.txFromJSON),
        update_admin: (this.txFromJSON),
        check_judging: (this.txFromJSON),
        create_bounty: (this.txFromJSON),
        delete_bounty: (this.txFromJSON),
        update_bounty: (this.txFromJSON),
        get_submission: (this.txFromJSON),
        select_winners: (this.txFromJSON),
        apply_to_bounty: (this.txFromJSON),
        get_bounty_status: (this.txFromJSON),
        get_user_bounties: (this.txFromJSON),
        update_submission: (this.txFromJSON),
        get_bounties_count: (this.txFromJSON),
        get_bounty_winners: (this.txFromJSON),
        get_owner_bounties: (this.txFromJSON),
        update_fee_account: (this.txFromJSON),
        get_active_bounties: (this.txFromJSON),
        get_bounties_by_token: (this.txFromJSON),
        get_bounty_applicants: (this.txFromJSON),
        get_bounties_by_status: (this.txFromJSON),
        get_bounty_submissions: (this.txFromJSON),
        get_user_bounties_count: (this.txFromJSON),
        get_owner_bounties_count: (this.txFromJSON),
        get_bounties_by_token_count: (this.txFromJSON),
        get_bounties_by_status_count: (this.txFromJSON)
    };
}
