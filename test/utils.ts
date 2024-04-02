import { BaseError } from "viem";

export function getCustomError(error: BaseError): string {
    const match = error.details.match(/'([^']+)'/);

    if (!match) return '';

    return match[1];
}