export type NestedJsonSchema = boolean | JsonSchema;
export type JsonSchema = {
  [k: string]: unknown;
  $schema?:
    | 'https://json-schema.org/draft/2020-12/schema'
    | 'http://json-schema.org/draft-07/schema#'
    | 'http://json-schema.org/draft-04/schema#';
  $id?: string;
  $anchor?: string;
  $ref?: string;
  $dynamicRef?: string;
  $dynamicAnchor?: string;
  $vocabulary?: Record<string, boolean>;
  $comment?: string;
  $defs?: Record<string, JsonSchema>;
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'integer';
  additionalItems?: NestedJsonSchema;
  unevaluatedItems?: NestedJsonSchema;
  prefixItems?: NestedJsonSchema[];
  items?: NestedJsonSchema | NestedJsonSchema[];
  contains?: NestedJsonSchema;
  additionalProperties?: NestedJsonSchema;
  unevaluatedProperties?: NestedJsonSchema;
  properties?: Record<string, NestedJsonSchema>;
  patternProperties?: Record<string, NestedJsonSchema>;
  dependentSchemas?: Record<string, NestedJsonSchema>;
  propertyNames?: NestedJsonSchema;
  if?: NestedJsonSchema;
  then?: NestedJsonSchema;
  else?: NestedJsonSchema;
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: NestedJsonSchema;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number | boolean;
  minimum?: number;
  exclusiveMinimum?: number | boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxContains?: number;
  minContains?: number;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  dependentRequired?: Record<string, string[]>;
  enum?: Array<string | number | boolean | null>;
  const?: string | number | boolean | null;

  // metadata
  id?: string;
  title?: string;
  description?: string;
  default?: unknown;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  nullable?: boolean;
  examples?: unknown[];
  format?: string;
  contentMediaType?: string;
  contentEncoding?: string;
  contentSchema?: JsonSchema;
};
