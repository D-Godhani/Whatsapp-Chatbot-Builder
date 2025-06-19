// components/fields/ApiCallFields.jsx
import { X } from "lucide-react";
import { ArrayInput } from "./ArrayInput";
import { DefaultField } from "./DefaultField";
import { BooleanField } from "./BooleanField";

const AuthFields = ({ authType, formData, onChange }) => {
  if (authType === "basic") {
    return (
      <form
        onSubmit={(e) => e.preventDefault()}
        className="mt-2 space-y-2"
        autoComplete="on"
      >
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={formData.username || ""}
          onChange={(e) => onChange("username", e.target.value)}
          placeholder="Username"
          className="w-full px-3 py-2 border rounded-md"
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={formData.password || ""}
          onChange={(e) => onChange("password", e.target.value)}
          placeholder="Password"
          className="w-full px-3 py-2 border rounded-md"
        />
      </form>
    );
  }
  if (authType === "bearer") {
    return (
      <input
        type="text"
        value={formData.bearerToken || ""}
        onChange={(e) => onChange("bearerToken", e.target.value)}
        placeholder="Bearer Token"
        className="mt-2 w-full px-3 py-2 border rounded-md"
      />
    );
  }
  if (authType === "custom") {
    return (
      <input
        type="text"
        value={formData.accessToken || ""}
        onChange={(e) => onChange("accessToken", e.target.value)}
        placeholder="Access Token"
        className="mt-2 w-full px-3 py-2 border rounded-md"
      />
    );
  }
  return null;
};

export function ApiCallFields({ formData, onChange }) {
  return (
    <>
      <DefaultField
        formData={formData}
        onChange={onChange}
        fieldKey="requestName"
      />

      <div className="mb-4">
        <label className="text-sm font-medium capitalize block mb-1">
          Method
        </label>
        <select
          value={formData.method}
          onChange={(e) => onChange("method", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      <DefaultField
        formData={formData}
        onChange={onChange}
        fieldKey="url"
        label="URL"
      />

      {/* Authentication */}
      <div className="mb-4">
        <label className="text-sm font-medium block mb-1">Authentication</label>
        <div className="flex flex-wrap gap-4 mt-1">
          {["none", "basic", "bearer", "custom"].map((type) => (
            <label
              key={type}
              className="flex items-center gap-1 text-sm cursor-pointer"
            >
              <input
                type="radio"
                checked={formData.authType === type}
                onChange={() => onChange("authType", type)}
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>
        <AuthFields
          authType={formData.authType}
          formData={formData}
          onChange={onChange}
        />
      </div>

      {/* Headers */}
      <ArrayInput
        label="Headers"
        items={formData.headers || []}
        onChange={(newHeaders) => onChange("headers", newHeaders)}
        newItemValue={{ key: "", value: "" }}
        addButtonLabel="Add Header"
        minItems={0}
        renderItem={({ item, index, onChange, onRemove }) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={item.key}
              placeholder="Key"
              onChange={(e) => onChange({ ...item, key: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <input
              type="text"
              value={item.value}
              placeholder="Value"
              onChange={(e) => onChange({ ...item, value: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <button
              onClick={onRemove}
              className="text-red-500 hover:text-red-700"
            >
              <X />
            </button>
          </div>
        )}
      />

      <DefaultField
        formData={formData}
        onChange={onChange}
        fieldKey="responseKey"
        label="Response Key (optional)"
      />

      {/* Response Type */}
      <div className="mb-4">
        <label className="text-sm font-medium block mb-1">Response Type</label>
        <div className="flex flex-wrap gap-4 mt-1">
          {["text", "media"].map((type) => (
            <label
              key={type}
              className="flex items-center gap-1 text-sm cursor-pointer"
            >
              <input
                type="radio"
                checked={formData.responseType === type}
                onChange={() => onChange("responseType", type)}
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Media Type & Options */}
      {formData.responseType === "media" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Media Type</label>
            <div className="flex flex-wrap gap-4 mt-1">
              {["image", "document", "video", "audio", "sticker"].map(
                (mediaType) => (
                  <label
                    key={mediaType}
                    className="flex items-center gap-1 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      checked={formData.mediaType === mediaType}
                      onChange={() => onChange("mediaType", mediaType)}
                    />
                    {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
                  </label>
                )
              )}
            </div>
          </div>

          <DefaultField
            formData={formData}
            onChange={onChange}
            fieldKey="filename"
            label="Filename (optional)"
          />

          <DefaultField
            formData={formData}
            onChange={onChange}
            fieldKey="caption"
            label="Caption (optional)"
          />
        </div>
      )}
    </>
  );
}
