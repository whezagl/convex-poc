import { useState, FormEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/server";

/**
 * UpdateData component provides a form for editing mock data in the Convex database.
 * Uses useMutation hook for data updates with automatic reactivity.
 * When data is updated, changes immediately propagate to all subscribed components.
 */
function UpdateData() {
  // Fetch all data to populate the select dropdown
  const mockData = useQuery(api.functions.getMockData);
  const updateData = useMutation(api.functions.updateMockData);

  // Form state
  const [selectedId, setSelectedId] = useState<Id<"mockData"> | null>(null);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  // Handle loading state
  if (mockData === undefined) {
    return (
      <div>
        <h2>Update Data</h2>
        <p>Loading...</p>
      </div>
    );
  }

  // Handle empty state
  if (mockData.length === 0) {
    return (
      <div>
        <h2>Update Data</h2>
        <p>No data available. Seed the database with: npm run seed-data</p>
      </div>
    );
  }

  // Handle item selection from dropdown
  const handleSelectItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value as Id<"mockData">;
    setSelectedId(id);

    // Find and populate form with selected item's data
    const item = mockData.find((d) => d._id === id);
    if (item) {
      setName(item.name);
      setValue(item.value);
      setDescription(item.description);
    }

    // Reset status
    setStatus("idle");
    setStatusMessage("");
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedId) {
      setStatus("error");
      setStatusMessage("Please select an item to update");
      return;
    }

    setStatus("loading");

    try {
      // Call mutation to update the data
      await updateData({
        id: selectedId,
        name: name || undefined,
        value: value || undefined,
        description: description || undefined,
      });

      setStatus("success");
      setStatusMessage("Data updated successfully!");
    } catch (error) {
      setStatus("error");
      setStatusMessage(`Failed to update data: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div>
      <h2>Update Data</h2>
      <p>Select an item to edit and modify its values. Changes will appear instantly in the View page.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="item-select">Select Item:</label>
          <select
            id="item-select"
            value={selectedId || ""}
            onChange={handleSelectItem}
            required
          >
            <option value="">-- Select an item --</option>
            {mockData.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {selectedId && (
          <>
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="value">Value:</label>
              <input
                id="value"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter value"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>

            <button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Updating..." : "Update Data"}
            </button>

            {status === "success" && (
              <p className="success-message">{statusMessage}</p>
            )}
            {status === "error" && (
              <p className="error-message">{statusMessage}</p>
            )}
          </>
        )}
      </form>
    </div>
  );
}

export default UpdateData;
