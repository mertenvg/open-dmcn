/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
// Generated from proto/bridge.proto with protobufjs-cli@1.1.x (same generator
// style as dmcn.js): pbjs -t static-module -w es6 -o bridge.js proto/bridge.proto
// Then patched: `const $root = {}` (was $protobuf.roots["default"]) so this
// standalone module uses its OWN root and never clobbers dmcn.js's shared root.
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = {}; // isolated: standalone root, does not touch dmcn.js shared root

export const dmcn = $root.dmcn = (() => {

    /**
     * Namespace dmcn.
     * @exports dmcn
     * @namespace
     */
    const dmcn = {};

    dmcn.bridge = (function() {

        /**
         * Namespace bridge.
         * @memberof dmcn
         * @namespace
         */
        const bridge = {};

        /**
         * BridgeTrustTier enum.
         * @name dmcn.bridge.BridgeTrustTier
         * @enum {number}
         * @property {number} BRIDGE_TRUST_TIER_UNSPECIFIED=0 BRIDGE_TRUST_TIER_UNSPECIFIED value
         * @property {number} BRIDGE_TRUST_TIER_VERIFIED_LEGACY=1 BRIDGE_TRUST_TIER_VERIFIED_LEGACY value
         * @property {number} BRIDGE_TRUST_TIER_UNVERIFIED_LEGACY=2 BRIDGE_TRUST_TIER_UNVERIFIED_LEGACY value
         * @property {number} BRIDGE_TRUST_TIER_SUSPICIOUS=3 BRIDGE_TRUST_TIER_SUSPICIOUS value
         */
        bridge.BridgeTrustTier = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "BRIDGE_TRUST_TIER_UNSPECIFIED"] = 0;
            values[valuesById[1] = "BRIDGE_TRUST_TIER_VERIFIED_LEGACY"] = 1;
            values[valuesById[2] = "BRIDGE_TRUST_TIER_UNVERIFIED_LEGACY"] = 2;
            values[valuesById[3] = "BRIDGE_TRUST_TIER_SUSPICIOUS"] = 3;
            return values;
        })();

        /**
         * SPFResult enum.
         * @name dmcn.bridge.SPFResult
         * @enum {number}
         * @property {number} SPF_RESULT_UNSPECIFIED=0 SPF_RESULT_UNSPECIFIED value
         * @property {number} SPF_RESULT_PASS=1 SPF_RESULT_PASS value
         * @property {number} SPF_RESULT_FAIL=2 SPF_RESULT_FAIL value
         * @property {number} SPF_RESULT_SOFTFAIL=3 SPF_RESULT_SOFTFAIL value
         * @property {number} SPF_RESULT_NEUTRAL=4 SPF_RESULT_NEUTRAL value
         */
        bridge.SPFResult = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "SPF_RESULT_UNSPECIFIED"] = 0;
            values[valuesById[1] = "SPF_RESULT_PASS"] = 1;
            values[valuesById[2] = "SPF_RESULT_FAIL"] = 2;
            values[valuesById[3] = "SPF_RESULT_SOFTFAIL"] = 3;
            values[valuesById[4] = "SPF_RESULT_NEUTRAL"] = 4;
            return values;
        })();

        /**
         * DKIMResult enum.
         * @name dmcn.bridge.DKIMResult
         * @enum {number}
         * @property {number} DKIM_RESULT_UNSPECIFIED=0 DKIM_RESULT_UNSPECIFIED value
         * @property {number} DKIM_RESULT_PASS=1 DKIM_RESULT_PASS value
         * @property {number} DKIM_RESULT_FAIL=2 DKIM_RESULT_FAIL value
         */
        bridge.DKIMResult = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "DKIM_RESULT_UNSPECIFIED"] = 0;
            values[valuesById[1] = "DKIM_RESULT_PASS"] = 1;
            values[valuesById[2] = "DKIM_RESULT_FAIL"] = 2;
            return values;
        })();

        /**
         * DMARCResult enum.
         * @name dmcn.bridge.DMARCResult
         * @enum {number}
         * @property {number} DMARC_RESULT_UNSPECIFIED=0 DMARC_RESULT_UNSPECIFIED value
         * @property {number} DMARC_RESULT_PASS=1 DMARC_RESULT_PASS value
         * @property {number} DMARC_RESULT_FAIL=2 DMARC_RESULT_FAIL value
         */
        bridge.DMARCResult = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "DMARC_RESULT_UNSPECIFIED"] = 0;
            values[valuesById[1] = "DMARC_RESULT_PASS"] = 1;
            values[valuesById[2] = "DMARC_RESULT_FAIL"] = 2;
            return values;
        })();

        bridge.BridgeClassificationRecord = (function() {

            /**
             * Properties of a BridgeClassificationRecord.
             * @memberof dmcn.bridge
             * @interface IBridgeClassificationRecord
             * @property {string|null} [bridgeAddress] BridgeClassificationRecord bridgeAddress
             * @property {Uint8Array|null} [bridgePublicKey] BridgeClassificationRecord bridgePublicKey
             * @property {string|null} [smtpFrom] BridgeClassificationRecord smtpFrom
             * @property {string|null} [smtpSenderIp] BridgeClassificationRecord smtpSenderIp
             * @property {dmcn.bridge.SPFResult|null} [spfResult] BridgeClassificationRecord spfResult
             * @property {dmcn.bridge.DKIMResult|null} [dkimResult] BridgeClassificationRecord dkimResult
             * @property {dmcn.bridge.DMARCResult|null} [dmarcResult] BridgeClassificationRecord dmarcResult
             * @property {number|null} [reputationScore] BridgeClassificationRecord reputationScore
             * @property {dmcn.bridge.BridgeTrustTier|null} [trustTier] BridgeClassificationRecord trustTier
             * @property {number|Long|null} [classifiedAt] BridgeClassificationRecord classifiedAt
             * @property {Uint8Array|null} [bridgeSignature] BridgeClassificationRecord bridgeSignature
             */

            /**
             * Constructs a new BridgeClassificationRecord.
             * @memberof dmcn.bridge
             * @classdesc Represents a BridgeClassificationRecord.
             * @implements IBridgeClassificationRecord
             * @constructor
             * @param {dmcn.bridge.IBridgeClassificationRecord=} [properties] Properties to set
             */
            function BridgeClassificationRecord(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * BridgeClassificationRecord bridgeAddress.
             * @member {string} bridgeAddress
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @instance
             */
            BridgeClassificationRecord.prototype.bridgeAddress = "";

            /**
             * BridgeClassificationRecord bridgePublicKey.
             * @member {Uint8Array} bridgePublicKey
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @instance
             */
            BridgeClassificationRecord.prototype.bridgePublicKey = $util.newBuffer([]);

            /**
             * BridgeClassificationRecord smtpFrom.
             * @member {string} smtpFrom
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @instance
             */
            BridgeClassificationRecord.prototype.smtpFrom = "";

            /**
             * BridgeClassificationRecord smtpSenderIp.
             * @member {string} smtpSenderIp
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @instance
             */
            BridgeClassificationRecord.prototype.smtpSenderIp = "";

            /**
             * BridgeClassificationRecord spfResult.
             * @member {dmcn.bridge.SPFResult} spfResult
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @instance
             */
            BridgeClassificationRecord.prototype.spfResult = 0;

            /**
             * BridgeClassificationRecord dkimResult.
             * @member {dmcn.bridge.DKIMResult} dkimResult
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @instance
             */
            BridgeClassificationRecord.prototype.dkimResult = 0;

            /**
             * BridgeClassificationRecord dmarcResult.
             * @member {dmcn.bridge.DMARCResult} dmarcResult
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @instance
             */
            BridgeClassificationRecord.prototype.dmarcResult = 0;

            /**
             * BridgeClassificationRecord reputationScore.
             * @member {number} reputationScore
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @instance
             */
            BridgeClassificationRecord.prototype.reputationScore = 0;

            /**
             * BridgeClassificationRecord trustTier.
             * @member {dmcn.bridge.BridgeTrustTier} trustTier
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @instance
             */
            BridgeClassificationRecord.prototype.trustTier = 0;

            /**
             * BridgeClassificationRecord classifiedAt.
             * @member {number|Long} classifiedAt
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @instance
             */
            BridgeClassificationRecord.prototype.classifiedAt = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * BridgeClassificationRecord bridgeSignature.
             * @member {Uint8Array} bridgeSignature
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @instance
             */
            BridgeClassificationRecord.prototype.bridgeSignature = $util.newBuffer([]);

            /**
             * Creates a new BridgeClassificationRecord instance using the specified properties.
             * @function create
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @static
             * @param {dmcn.bridge.IBridgeClassificationRecord=} [properties] Properties to set
             * @returns {dmcn.bridge.BridgeClassificationRecord} BridgeClassificationRecord instance
             */
            BridgeClassificationRecord.create = function create(properties) {
                return new BridgeClassificationRecord(properties);
            };

            /**
             * Encodes the specified BridgeClassificationRecord message. Does not implicitly {@link dmcn.bridge.BridgeClassificationRecord.verify|verify} messages.
             * @function encode
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @static
             * @param {dmcn.bridge.IBridgeClassificationRecord} message BridgeClassificationRecord message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            BridgeClassificationRecord.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.bridgeAddress != null && Object.hasOwnProperty.call(message, "bridgeAddress"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.bridgeAddress);
                if (message.bridgePublicKey != null && Object.hasOwnProperty.call(message, "bridgePublicKey"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.bridgePublicKey);
                if (message.smtpFrom != null && Object.hasOwnProperty.call(message, "smtpFrom"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.smtpFrom);
                if (message.smtpSenderIp != null && Object.hasOwnProperty.call(message, "smtpSenderIp"))
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.smtpSenderIp);
                if (message.spfResult != null && Object.hasOwnProperty.call(message, "spfResult"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int32(message.spfResult);
                if (message.dkimResult != null && Object.hasOwnProperty.call(message, "dkimResult"))
                    writer.uint32(/* id 6, wireType 0 =*/48).int32(message.dkimResult);
                if (message.dmarcResult != null && Object.hasOwnProperty.call(message, "dmarcResult"))
                    writer.uint32(/* id 7, wireType 0 =*/56).int32(message.dmarcResult);
                if (message.reputationScore != null && Object.hasOwnProperty.call(message, "reputationScore"))
                    writer.uint32(/* id 8, wireType 0 =*/64).int32(message.reputationScore);
                if (message.trustTier != null && Object.hasOwnProperty.call(message, "trustTier"))
                    writer.uint32(/* id 9, wireType 0 =*/72).int32(message.trustTier);
                if (message.classifiedAt != null && Object.hasOwnProperty.call(message, "classifiedAt"))
                    writer.uint32(/* id 10, wireType 0 =*/80).int64(message.classifiedAt);
                if (message.bridgeSignature != null && Object.hasOwnProperty.call(message, "bridgeSignature"))
                    writer.uint32(/* id 11, wireType 2 =*/90).bytes(message.bridgeSignature);
                return writer;
            };

            /**
             * Encodes the specified BridgeClassificationRecord message, length delimited. Does not implicitly {@link dmcn.bridge.BridgeClassificationRecord.verify|verify} messages.
             * @function encodeDelimited
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @static
             * @param {dmcn.bridge.IBridgeClassificationRecord} message BridgeClassificationRecord message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            BridgeClassificationRecord.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a BridgeClassificationRecord message from the specified reader or buffer.
             * @function decode
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {dmcn.bridge.BridgeClassificationRecord} BridgeClassificationRecord
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            BridgeClassificationRecord.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.dmcn.bridge.BridgeClassificationRecord();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.bridgeAddress = reader.string();
                            break;
                        }
                    case 2: {
                            message.bridgePublicKey = reader.bytes();
                            break;
                        }
                    case 3: {
                            message.smtpFrom = reader.string();
                            break;
                        }
                    case 4: {
                            message.smtpSenderIp = reader.string();
                            break;
                        }
                    case 5: {
                            message.spfResult = reader.int32();
                            break;
                        }
                    case 6: {
                            message.dkimResult = reader.int32();
                            break;
                        }
                    case 7: {
                            message.dmarcResult = reader.int32();
                            break;
                        }
                    case 8: {
                            message.reputationScore = reader.int32();
                            break;
                        }
                    case 9: {
                            message.trustTier = reader.int32();
                            break;
                        }
                    case 10: {
                            message.classifiedAt = reader.int64();
                            break;
                        }
                    case 11: {
                            message.bridgeSignature = reader.bytes();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a BridgeClassificationRecord message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {dmcn.bridge.BridgeClassificationRecord} BridgeClassificationRecord
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            BridgeClassificationRecord.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a BridgeClassificationRecord message.
             * @function verify
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            BridgeClassificationRecord.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.bridgeAddress != null && Object.hasOwnProperty.call(message, "bridgeAddress"))
                    if (!$util.isString(message.bridgeAddress))
                        return "bridgeAddress: string expected";
                if (message.bridgePublicKey != null && Object.hasOwnProperty.call(message, "bridgePublicKey"))
                    if (!(message.bridgePublicKey && typeof message.bridgePublicKey.length === "number" || $util.isString(message.bridgePublicKey)))
                        return "bridgePublicKey: buffer expected";
                if (message.smtpFrom != null && Object.hasOwnProperty.call(message, "smtpFrom"))
                    if (!$util.isString(message.smtpFrom))
                        return "smtpFrom: string expected";
                if (message.smtpSenderIp != null && Object.hasOwnProperty.call(message, "smtpSenderIp"))
                    if (!$util.isString(message.smtpSenderIp))
                        return "smtpSenderIp: string expected";
                if (message.spfResult != null && Object.hasOwnProperty.call(message, "spfResult"))
                    switch (message.spfResult) {
                    default:
                        return "spfResult: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                        break;
                    }
                if (message.dkimResult != null && Object.hasOwnProperty.call(message, "dkimResult"))
                    switch (message.dkimResult) {
                    default:
                        return "dkimResult: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.dmarcResult != null && Object.hasOwnProperty.call(message, "dmarcResult"))
                    switch (message.dmarcResult) {
                    default:
                        return "dmarcResult: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.reputationScore != null && Object.hasOwnProperty.call(message, "reputationScore"))
                    if (!$util.isInteger(message.reputationScore))
                        return "reputationScore: integer expected";
                if (message.trustTier != null && Object.hasOwnProperty.call(message, "trustTier"))
                    switch (message.trustTier) {
                    default:
                        return "trustTier: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        break;
                    }
                if (message.classifiedAt != null && Object.hasOwnProperty.call(message, "classifiedAt"))
                    if (!$util.isInteger(message.classifiedAt) && !(message.classifiedAt && $util.isInteger(message.classifiedAt.low) && $util.isInteger(message.classifiedAt.high)))
                        return "classifiedAt: integer|Long expected";
                if (message.bridgeSignature != null && Object.hasOwnProperty.call(message, "bridgeSignature"))
                    if (!(message.bridgeSignature && typeof message.bridgeSignature.length === "number" || $util.isString(message.bridgeSignature)))
                        return "bridgeSignature: buffer expected";
                return null;
            };

            /**
             * Creates a BridgeClassificationRecord message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {dmcn.bridge.BridgeClassificationRecord} BridgeClassificationRecord
             */
            BridgeClassificationRecord.fromObject = function fromObject(object, long) {
                if (object instanceof $root.dmcn.bridge.BridgeClassificationRecord)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".dmcn.bridge.BridgeClassificationRecord: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.dmcn.bridge.BridgeClassificationRecord();
                if (object.bridgeAddress != null)
                    message.bridgeAddress = String(object.bridgeAddress);
                if (object.bridgePublicKey != null)
                    if (typeof object.bridgePublicKey === "string")
                        $util.base64.decode(object.bridgePublicKey, message.bridgePublicKey = $util.newBuffer($util.base64.length(object.bridgePublicKey)), 0);
                    else if (object.bridgePublicKey.length >= 0)
                        message.bridgePublicKey = object.bridgePublicKey;
                if (object.smtpFrom != null)
                    message.smtpFrom = String(object.smtpFrom);
                if (object.smtpSenderIp != null)
                    message.smtpSenderIp = String(object.smtpSenderIp);
                switch (object.spfResult) {
                default:
                    if (typeof object.spfResult === "number") {
                        message.spfResult = object.spfResult;
                        break;
                    }
                    break;
                case "SPF_RESULT_UNSPECIFIED":
                case 0:
                    message.spfResult = 0;
                    break;
                case "SPF_RESULT_PASS":
                case 1:
                    message.spfResult = 1;
                    break;
                case "SPF_RESULT_FAIL":
                case 2:
                    message.spfResult = 2;
                    break;
                case "SPF_RESULT_SOFTFAIL":
                case 3:
                    message.spfResult = 3;
                    break;
                case "SPF_RESULT_NEUTRAL":
                case 4:
                    message.spfResult = 4;
                    break;
                }
                switch (object.dkimResult) {
                default:
                    if (typeof object.dkimResult === "number") {
                        message.dkimResult = object.dkimResult;
                        break;
                    }
                    break;
                case "DKIM_RESULT_UNSPECIFIED":
                case 0:
                    message.dkimResult = 0;
                    break;
                case "DKIM_RESULT_PASS":
                case 1:
                    message.dkimResult = 1;
                    break;
                case "DKIM_RESULT_FAIL":
                case 2:
                    message.dkimResult = 2;
                    break;
                }
                switch (object.dmarcResult) {
                default:
                    if (typeof object.dmarcResult === "number") {
                        message.dmarcResult = object.dmarcResult;
                        break;
                    }
                    break;
                case "DMARC_RESULT_UNSPECIFIED":
                case 0:
                    message.dmarcResult = 0;
                    break;
                case "DMARC_RESULT_PASS":
                case 1:
                    message.dmarcResult = 1;
                    break;
                case "DMARC_RESULT_FAIL":
                case 2:
                    message.dmarcResult = 2;
                    break;
                }
                if (object.reputationScore != null)
                    message.reputationScore = object.reputationScore | 0;
                switch (object.trustTier) {
                default:
                    if (typeof object.trustTier === "number") {
                        message.trustTier = object.trustTier;
                        break;
                    }
                    break;
                case "BRIDGE_TRUST_TIER_UNSPECIFIED":
                case 0:
                    message.trustTier = 0;
                    break;
                case "BRIDGE_TRUST_TIER_VERIFIED_LEGACY":
                case 1:
                    message.trustTier = 1;
                    break;
                case "BRIDGE_TRUST_TIER_UNVERIFIED_LEGACY":
                case 2:
                    message.trustTier = 2;
                    break;
                case "BRIDGE_TRUST_TIER_SUSPICIOUS":
                case 3:
                    message.trustTier = 3;
                    break;
                }
                if (object.classifiedAt != null)
                    if ($util.Long)
                        message.classifiedAt = $util.Long.fromValue(object.classifiedAt, false);
                    else if (typeof object.classifiedAt === "string")
                        message.classifiedAt = parseInt(object.classifiedAt, 10);
                    else if (typeof object.classifiedAt === "number")
                        message.classifiedAt = object.classifiedAt;
                    else if (typeof object.classifiedAt === "object")
                        message.classifiedAt = new $util.LongBits(object.classifiedAt.low >>> 0, object.classifiedAt.high >>> 0).toNumber();
                if (object.bridgeSignature != null)
                    if (typeof object.bridgeSignature === "string")
                        $util.base64.decode(object.bridgeSignature, message.bridgeSignature = $util.newBuffer($util.base64.length(object.bridgeSignature)), 0);
                    else if (object.bridgeSignature.length >= 0)
                        message.bridgeSignature = object.bridgeSignature;
                return message;
            };

            /**
             * Creates a plain object from a BridgeClassificationRecord message. Also converts values to other types if specified.
             * @function toObject
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @static
             * @param {dmcn.bridge.BridgeClassificationRecord} message BridgeClassificationRecord
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            BridgeClassificationRecord.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    object.bridgeAddress = "";
                    if (options.bytes === String)
                        object.bridgePublicKey = "";
                    else {
                        object.bridgePublicKey = [];
                        if (options.bytes !== Array)
                            object.bridgePublicKey = $util.newBuffer(object.bridgePublicKey);
                    }
                    object.smtpFrom = "";
                    object.smtpSenderIp = "";
                    object.spfResult = options.enums === String ? "SPF_RESULT_UNSPECIFIED" : 0;
                    object.dkimResult = options.enums === String ? "DKIM_RESULT_UNSPECIFIED" : 0;
                    object.dmarcResult = options.enums === String ? "DMARC_RESULT_UNSPECIFIED" : 0;
                    object.reputationScore = 0;
                    object.trustTier = options.enums === String ? "BRIDGE_TRUST_TIER_UNSPECIFIED" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.classifiedAt = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.classifiedAt = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    if (options.bytes === String)
                        object.bridgeSignature = "";
                    else {
                        object.bridgeSignature = [];
                        if (options.bytes !== Array)
                            object.bridgeSignature = $util.newBuffer(object.bridgeSignature);
                    }
                }
                if (message.bridgeAddress != null && Object.hasOwnProperty.call(message, "bridgeAddress"))
                    object.bridgeAddress = message.bridgeAddress;
                if (message.bridgePublicKey != null && Object.hasOwnProperty.call(message, "bridgePublicKey"))
                    object.bridgePublicKey = options.bytes === String ? $util.base64.encode(message.bridgePublicKey, 0, message.bridgePublicKey.length) : options.bytes === Array ? Array.prototype.slice.call(message.bridgePublicKey) : message.bridgePublicKey;
                if (message.smtpFrom != null && Object.hasOwnProperty.call(message, "smtpFrom"))
                    object.smtpFrom = message.smtpFrom;
                if (message.smtpSenderIp != null && Object.hasOwnProperty.call(message, "smtpSenderIp"))
                    object.smtpSenderIp = message.smtpSenderIp;
                if (message.spfResult != null && Object.hasOwnProperty.call(message, "spfResult"))
                    object.spfResult = options.enums === String ? $root.dmcn.bridge.SPFResult[message.spfResult] === undefined ? message.spfResult : $root.dmcn.bridge.SPFResult[message.spfResult] : message.spfResult;
                if (message.dkimResult != null && Object.hasOwnProperty.call(message, "dkimResult"))
                    object.dkimResult = options.enums === String ? $root.dmcn.bridge.DKIMResult[message.dkimResult] === undefined ? message.dkimResult : $root.dmcn.bridge.DKIMResult[message.dkimResult] : message.dkimResult;
                if (message.dmarcResult != null && Object.hasOwnProperty.call(message, "dmarcResult"))
                    object.dmarcResult = options.enums === String ? $root.dmcn.bridge.DMARCResult[message.dmarcResult] === undefined ? message.dmarcResult : $root.dmcn.bridge.DMARCResult[message.dmarcResult] : message.dmarcResult;
                if (message.reputationScore != null && Object.hasOwnProperty.call(message, "reputationScore"))
                    object.reputationScore = message.reputationScore;
                if (message.trustTier != null && Object.hasOwnProperty.call(message, "trustTier"))
                    object.trustTier = options.enums === String ? $root.dmcn.bridge.BridgeTrustTier[message.trustTier] === undefined ? message.trustTier : $root.dmcn.bridge.BridgeTrustTier[message.trustTier] : message.trustTier;
                if (message.classifiedAt != null && Object.hasOwnProperty.call(message, "classifiedAt"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.classifiedAt = typeof message.classifiedAt === "number" ? BigInt(message.classifiedAt) : $util.Long.fromBits(message.classifiedAt.low >>> 0, message.classifiedAt.high >>> 0, false).toBigInt();
                    else if (typeof message.classifiedAt === "number")
                        object.classifiedAt = options.longs === String ? String(message.classifiedAt) : message.classifiedAt;
                    else
                        object.classifiedAt = options.longs === String ? $util.Long.prototype.toString.call(message.classifiedAt) : options.longs === Number ? new $util.LongBits(message.classifiedAt.low >>> 0, message.classifiedAt.high >>> 0).toNumber() : message.classifiedAt;
                if (message.bridgeSignature != null && Object.hasOwnProperty.call(message, "bridgeSignature"))
                    object.bridgeSignature = options.bytes === String ? $util.base64.encode(message.bridgeSignature, 0, message.bridgeSignature.length) : options.bytes === Array ? Array.prototype.slice.call(message.bridgeSignature) : message.bridgeSignature;
                return object;
            };

            /**
             * Converts this BridgeClassificationRecord to JSON.
             * @function toJSON
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            BridgeClassificationRecord.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for BridgeClassificationRecord
             * @function getTypeUrl
             * @memberof dmcn.bridge.BridgeClassificationRecord
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            BridgeClassificationRecord.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/dmcn.bridge.BridgeClassificationRecord";
            };

            return BridgeClassificationRecord;
        })();

        bridge.BridgeDeliveryReceipt = (function() {

            /**
             * Properties of a BridgeDeliveryReceipt.
             * @memberof dmcn.bridge
             * @interface IBridgeDeliveryReceipt
             * @property {Uint8Array|null} [originalMessageId] BridgeDeliveryReceipt originalMessageId
             * @property {string|null} [recipientEmail] BridgeDeliveryReceipt recipientEmail
             * @property {string|null} [bridgeAddress] BridgeDeliveryReceipt bridgeAddress
             * @property {number|Long|null} [deliveredAt] BridgeDeliveryReceipt deliveredAt
             * @property {boolean|null} [success] BridgeDeliveryReceipt success
             * @property {string|null} [errorDetail] BridgeDeliveryReceipt errorDetail
             * @property {Uint8Array|null} [bridgeSignature] BridgeDeliveryReceipt bridgeSignature
             */

            /**
             * Constructs a new BridgeDeliveryReceipt.
             * @memberof dmcn.bridge
             * @classdesc Represents a BridgeDeliveryReceipt.
             * @implements IBridgeDeliveryReceipt
             * @constructor
             * @param {dmcn.bridge.IBridgeDeliveryReceipt=} [properties] Properties to set
             */
            function BridgeDeliveryReceipt(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * BridgeDeliveryReceipt originalMessageId.
             * @member {Uint8Array} originalMessageId
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @instance
             */
            BridgeDeliveryReceipt.prototype.originalMessageId = $util.newBuffer([]);

            /**
             * BridgeDeliveryReceipt recipientEmail.
             * @member {string} recipientEmail
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @instance
             */
            BridgeDeliveryReceipt.prototype.recipientEmail = "";

            /**
             * BridgeDeliveryReceipt bridgeAddress.
             * @member {string} bridgeAddress
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @instance
             */
            BridgeDeliveryReceipt.prototype.bridgeAddress = "";

            /**
             * BridgeDeliveryReceipt deliveredAt.
             * @member {number|Long} deliveredAt
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @instance
             */
            BridgeDeliveryReceipt.prototype.deliveredAt = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * BridgeDeliveryReceipt success.
             * @member {boolean} success
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @instance
             */
            BridgeDeliveryReceipt.prototype.success = false;

            /**
             * BridgeDeliveryReceipt errorDetail.
             * @member {string} errorDetail
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @instance
             */
            BridgeDeliveryReceipt.prototype.errorDetail = "";

            /**
             * BridgeDeliveryReceipt bridgeSignature.
             * @member {Uint8Array} bridgeSignature
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @instance
             */
            BridgeDeliveryReceipt.prototype.bridgeSignature = $util.newBuffer([]);

            /**
             * Creates a new BridgeDeliveryReceipt instance using the specified properties.
             * @function create
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @static
             * @param {dmcn.bridge.IBridgeDeliveryReceipt=} [properties] Properties to set
             * @returns {dmcn.bridge.BridgeDeliveryReceipt} BridgeDeliveryReceipt instance
             */
            BridgeDeliveryReceipt.create = function create(properties) {
                return new BridgeDeliveryReceipt(properties);
            };

            /**
             * Encodes the specified BridgeDeliveryReceipt message. Does not implicitly {@link dmcn.bridge.BridgeDeliveryReceipt.verify|verify} messages.
             * @function encode
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @static
             * @param {dmcn.bridge.IBridgeDeliveryReceipt} message BridgeDeliveryReceipt message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            BridgeDeliveryReceipt.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.originalMessageId != null && Object.hasOwnProperty.call(message, "originalMessageId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.originalMessageId);
                if (message.recipientEmail != null && Object.hasOwnProperty.call(message, "recipientEmail"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.recipientEmail);
                if (message.bridgeAddress != null && Object.hasOwnProperty.call(message, "bridgeAddress"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.bridgeAddress);
                if (message.deliveredAt != null && Object.hasOwnProperty.call(message, "deliveredAt"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int64(message.deliveredAt);
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 5, wireType 0 =*/40).bool(message.success);
                if (message.errorDetail != null && Object.hasOwnProperty.call(message, "errorDetail"))
                    writer.uint32(/* id 6, wireType 2 =*/50).string(message.errorDetail);
                if (message.bridgeSignature != null && Object.hasOwnProperty.call(message, "bridgeSignature"))
                    writer.uint32(/* id 7, wireType 2 =*/58).bytes(message.bridgeSignature);
                return writer;
            };

            /**
             * Encodes the specified BridgeDeliveryReceipt message, length delimited. Does not implicitly {@link dmcn.bridge.BridgeDeliveryReceipt.verify|verify} messages.
             * @function encodeDelimited
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @static
             * @param {dmcn.bridge.IBridgeDeliveryReceipt} message BridgeDeliveryReceipt message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            BridgeDeliveryReceipt.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a BridgeDeliveryReceipt message from the specified reader or buffer.
             * @function decode
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {dmcn.bridge.BridgeDeliveryReceipt} BridgeDeliveryReceipt
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            BridgeDeliveryReceipt.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.dmcn.bridge.BridgeDeliveryReceipt();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.originalMessageId = reader.bytes();
                            break;
                        }
                    case 2: {
                            message.recipientEmail = reader.string();
                            break;
                        }
                    case 3: {
                            message.bridgeAddress = reader.string();
                            break;
                        }
                    case 4: {
                            message.deliveredAt = reader.int64();
                            break;
                        }
                    case 5: {
                            message.success = reader.bool();
                            break;
                        }
                    case 6: {
                            message.errorDetail = reader.string();
                            break;
                        }
                    case 7: {
                            message.bridgeSignature = reader.bytes();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a BridgeDeliveryReceipt message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {dmcn.bridge.BridgeDeliveryReceipt} BridgeDeliveryReceipt
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            BridgeDeliveryReceipt.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a BridgeDeliveryReceipt message.
             * @function verify
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            BridgeDeliveryReceipt.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.originalMessageId != null && Object.hasOwnProperty.call(message, "originalMessageId"))
                    if (!(message.originalMessageId && typeof message.originalMessageId.length === "number" || $util.isString(message.originalMessageId)))
                        return "originalMessageId: buffer expected";
                if (message.recipientEmail != null && Object.hasOwnProperty.call(message, "recipientEmail"))
                    if (!$util.isString(message.recipientEmail))
                        return "recipientEmail: string expected";
                if (message.bridgeAddress != null && Object.hasOwnProperty.call(message, "bridgeAddress"))
                    if (!$util.isString(message.bridgeAddress))
                        return "bridgeAddress: string expected";
                if (message.deliveredAt != null && Object.hasOwnProperty.call(message, "deliveredAt"))
                    if (!$util.isInteger(message.deliveredAt) && !(message.deliveredAt && $util.isInteger(message.deliveredAt.low) && $util.isInteger(message.deliveredAt.high)))
                        return "deliveredAt: integer|Long expected";
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    if (typeof message.success !== "boolean")
                        return "success: boolean expected";
                if (message.errorDetail != null && Object.hasOwnProperty.call(message, "errorDetail"))
                    if (!$util.isString(message.errorDetail))
                        return "errorDetail: string expected";
                if (message.bridgeSignature != null && Object.hasOwnProperty.call(message, "bridgeSignature"))
                    if (!(message.bridgeSignature && typeof message.bridgeSignature.length === "number" || $util.isString(message.bridgeSignature)))
                        return "bridgeSignature: buffer expected";
                return null;
            };

            /**
             * Creates a BridgeDeliveryReceipt message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {dmcn.bridge.BridgeDeliveryReceipt} BridgeDeliveryReceipt
             */
            BridgeDeliveryReceipt.fromObject = function fromObject(object, long) {
                if (object instanceof $root.dmcn.bridge.BridgeDeliveryReceipt)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".dmcn.bridge.BridgeDeliveryReceipt: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.dmcn.bridge.BridgeDeliveryReceipt();
                if (object.originalMessageId != null)
                    if (typeof object.originalMessageId === "string")
                        $util.base64.decode(object.originalMessageId, message.originalMessageId = $util.newBuffer($util.base64.length(object.originalMessageId)), 0);
                    else if (object.originalMessageId.length >= 0)
                        message.originalMessageId = object.originalMessageId;
                if (object.recipientEmail != null)
                    message.recipientEmail = String(object.recipientEmail);
                if (object.bridgeAddress != null)
                    message.bridgeAddress = String(object.bridgeAddress);
                if (object.deliveredAt != null)
                    if ($util.Long)
                        message.deliveredAt = $util.Long.fromValue(object.deliveredAt, false);
                    else if (typeof object.deliveredAt === "string")
                        message.deliveredAt = parseInt(object.deliveredAt, 10);
                    else if (typeof object.deliveredAt === "number")
                        message.deliveredAt = object.deliveredAt;
                    else if (typeof object.deliveredAt === "object")
                        message.deliveredAt = new $util.LongBits(object.deliveredAt.low >>> 0, object.deliveredAt.high >>> 0).toNumber();
                if (object.success != null)
                    message.success = Boolean(object.success);
                if (object.errorDetail != null)
                    message.errorDetail = String(object.errorDetail);
                if (object.bridgeSignature != null)
                    if (typeof object.bridgeSignature === "string")
                        $util.base64.decode(object.bridgeSignature, message.bridgeSignature = $util.newBuffer($util.base64.length(object.bridgeSignature)), 0);
                    else if (object.bridgeSignature.length >= 0)
                        message.bridgeSignature = object.bridgeSignature;
                return message;
            };

            /**
             * Creates a plain object from a BridgeDeliveryReceipt message. Also converts values to other types if specified.
             * @function toObject
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @static
             * @param {dmcn.bridge.BridgeDeliveryReceipt} message BridgeDeliveryReceipt
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            BridgeDeliveryReceipt.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    if (options.bytes === String)
                        object.originalMessageId = "";
                    else {
                        object.originalMessageId = [];
                        if (options.bytes !== Array)
                            object.originalMessageId = $util.newBuffer(object.originalMessageId);
                    }
                    object.recipientEmail = "";
                    object.bridgeAddress = "";
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.deliveredAt = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.deliveredAt = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    object.success = false;
                    object.errorDetail = "";
                    if (options.bytes === String)
                        object.bridgeSignature = "";
                    else {
                        object.bridgeSignature = [];
                        if (options.bytes !== Array)
                            object.bridgeSignature = $util.newBuffer(object.bridgeSignature);
                    }
                }
                if (message.originalMessageId != null && Object.hasOwnProperty.call(message, "originalMessageId"))
                    object.originalMessageId = options.bytes === String ? $util.base64.encode(message.originalMessageId, 0, message.originalMessageId.length) : options.bytes === Array ? Array.prototype.slice.call(message.originalMessageId) : message.originalMessageId;
                if (message.recipientEmail != null && Object.hasOwnProperty.call(message, "recipientEmail"))
                    object.recipientEmail = message.recipientEmail;
                if (message.bridgeAddress != null && Object.hasOwnProperty.call(message, "bridgeAddress"))
                    object.bridgeAddress = message.bridgeAddress;
                if (message.deliveredAt != null && Object.hasOwnProperty.call(message, "deliveredAt"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.deliveredAt = typeof message.deliveredAt === "number" ? BigInt(message.deliveredAt) : $util.Long.fromBits(message.deliveredAt.low >>> 0, message.deliveredAt.high >>> 0, false).toBigInt();
                    else if (typeof message.deliveredAt === "number")
                        object.deliveredAt = options.longs === String ? String(message.deliveredAt) : message.deliveredAt;
                    else
                        object.deliveredAt = options.longs === String ? $util.Long.prototype.toString.call(message.deliveredAt) : options.longs === Number ? new $util.LongBits(message.deliveredAt.low >>> 0, message.deliveredAt.high >>> 0).toNumber() : message.deliveredAt;
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    object.success = message.success;
                if (message.errorDetail != null && Object.hasOwnProperty.call(message, "errorDetail"))
                    object.errorDetail = message.errorDetail;
                if (message.bridgeSignature != null && Object.hasOwnProperty.call(message, "bridgeSignature"))
                    object.bridgeSignature = options.bytes === String ? $util.base64.encode(message.bridgeSignature, 0, message.bridgeSignature.length) : options.bytes === Array ? Array.prototype.slice.call(message.bridgeSignature) : message.bridgeSignature;
                return object;
            };

            /**
             * Converts this BridgeDeliveryReceipt to JSON.
             * @function toJSON
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            BridgeDeliveryReceipt.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for BridgeDeliveryReceipt
             * @function getTypeUrl
             * @memberof dmcn.bridge.BridgeDeliveryReceipt
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            BridgeDeliveryReceipt.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/dmcn.bridge.BridgeDeliveryReceipt";
            };

            return BridgeDeliveryReceipt;
        })();

        return bridge;
    })();

    return dmcn;
})();

export { $root as default };
