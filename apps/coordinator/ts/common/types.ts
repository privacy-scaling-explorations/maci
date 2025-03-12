import { CreateKernelAccountReturnType, KernelAccountClient } from "@zerodev/sdk";
import { BundlerClient } from "permissionless";
import { ENTRYPOINT_ADDRESS_V07_TYPE } from "permissionless/types";

import type { Chain, HttpTransport, PublicClient, Transport } from "viem";

export type KernelClientType = KernelAccountClient<Transport, Chain, CreateKernelAccountReturnType>;

export type BundlerClientType = BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>;

export type PublicClientType = PublicClient<Transport, Chain>;

export type PublicClientHTTPType = PublicClient<HttpTransport, Chain>;
