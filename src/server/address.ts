import { AddressStringFormat } from "@eversdk/core"

export function resolveAddress(
    address: string,
    format: AddressStringFormat = { type: "Hex" },
): string {
    try {
        return addressToString(parseAddressData(address), format)
    } catch {
        return address
    }
}

const FLAG_BOUNCEABLE = 0x11
const FLAG_NON_BOUNCEABLE = 0x51
const FLAG_TEST_ONLY = 0x80

type AddressData = {
    account: Uint8Array
    workchain: number
    bounceable: boolean
    testOnly: boolean
}

function parseAddressData(source: string): AddressData {
    const encodedRe = /^([a-zA-Z0-9_-]{48}|[a-zA-Z0-9/+]{48})$/
    const rawRe = /^-?[0-9]:[a-zA-Z0-9]{64}$/
    if (encodedRe.test(source)) {
        const sourceBytes = Array.from(
            base64ToBytes(source.replace(/-/g, "+").replace(/_/g, "/")),
        )
        const address = sourceBytes.splice(0, 34)
        const crc = sourceBytes.splice(0, 2)
        const calculatedCrc = Array.from(crc16BytesBe(address))

        if (!bytesCompare(calculatedCrc, crc)) {
            throw new Error("Address: can't parse address. Wrong checksum.")
        }

        const { buffer } = new Uint8Array(address.splice(0, 2))
        const view = new DataView(buffer)
        const tag = view.getUint8(0)
        const workchain = view.getInt8(1)
        const account = new Uint8Array(address.splice(0, 32))
        const { bounceable, testOnly } = decodeTag(tag)

        return {
            bounceable,
            testOnly,
            workchain,
            account,
        }
    }
    if (rawRe.test(source)) {
        const data = source.split(":")
        const workchain = parseInt(data[0], 10)
        const hash = hexToBytes(data[1])
        const bounceable = false
        const testOnly = false

        return {
            bounceable,
            testOnly,
            workchain,
            account: hash,
        }
    }
    throw new Error(`Invalid address string: ${source}`)
}

function encodeTag(bounceable: boolean, testOnly: boolean): number {
    const tag = bounceable ? FLAG_BOUNCEABLE : FLAG_NON_BOUNCEABLE
    return testOnly ? tag | FLAG_TEST_ONLY : tag
}

function decodeTag(tag: number): { bounceable: boolean; testOnly: boolean } {
    let data = tag
    const testOnly = (data & FLAG_TEST_ONLY) !== 0

    if (testOnly) {
        data ^= FLAG_TEST_ONLY
    }

    if (![FLAG_BOUNCEABLE, FLAG_NON_BOUNCEABLE].includes(data)) {
        new Error("Address: bad address tag.")
    }

    const bounceable = data === FLAG_BOUNCEABLE

    return {
        bounceable,
        testOnly,
    }
}

function addressToString(
    address: AddressData,
    outputFormat: AddressStringFormat,
): string {
    if (address.workchain < -128 || address.workchain >= 128) {
        throw new Error("Address: workchain must be int8.")
    }

    switch (outputFormat.type) {
        case "Hex":
            return `${address.workchain}:${bytesToHex(
                address.account,
            )}`.toLowerCase()
        case "Base64": {
            const tag = encodeTag(outputFormat.bounce, outputFormat.test)
            const bytes = new Uint8Array([
                tag,
                address.workchain,
                ...address.account,
            ])
            const checksum = crc16BytesBe(bytes)
            const base64 = bytesToBase64(
                new Uint8Array([...bytes, ...checksum]),
            )

            return outputFormat.url
                ? base64.replace(/\//g, "_").replace(/\+/g, "-")
                : base64.replace(/_/g, "/").replace(/-/g, "+")
        }
        default:
            return `${address.workchain}:${bytesToHex(
                address.account,
            )}`.toLowerCase()
    }
}

function hexToBytes(hex: string): Uint8Array {
    return new Uint8Array(
        (hex.match(/.{1,2}/g) ?? []).map(byte => parseInt(byte, 16)),
    )
}

function bytesToHex(bytes: Uint8Array): string {
    return bytes.reduce((acc, uint) => `${acc}${uintToHex(uint)}`, "")
}

function uintToHex(uint: number): string {
    const hex = `0${uint.toString(16)}`
    return hex.slice(-(Math.floor(hex.length / 2) * 2))
}

function bytesToBase64(data: Uint8Array | number[]): string {
    const bytes = new Uint8Array(data)
    return Buffer.from(bytes).toString("base64")
}

function base64ToBytes(base64: string): Uint8Array {
    const binary = Buffer.from(base64, "base64").toString("binary")
    return Uint8Array.from(binary, char => char.charCodeAt(0))
}

function crc16BytesBe(data: Uint8Array | number[]): Uint8Array {
    const crc = crc16(data)
    const buffer = new ArrayBuffer(2)
    const view = new DataView(buffer)

    view.setUint16(0, crc, false)

    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
}

function crc16(data: Uint8Array | number[]): number {
    const POLY = 0x1021
    const bytes = new Uint8Array(data)
    const int16 =
        bytes.reduce((acc, el) => {
            let crc = acc ^ (el << 8)

            for (let i = 0; i < 8; i++) {
                crc = (crc & 0x8000) === 0x8000 ? (crc << 1) ^ POLY : crc << 1
            }

            return crc
        }, 0) & 0xffff

    const [uint16] = new Uint16Array([int16])

    return uint16
}

function bytesCompare(a: number[], b: number[]): boolean {
    if (a.length !== b.length) {
        return false
    }

    return Array.from(a).every((uint, i) => uint === b[i])
}
