import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { DataModel } from "../convex/_generated/dataModel";

/**
 * ViewData component displays mock data from the Convex database.
 * Uses useQuery hook for automatic real-time data synchronization.
 * When data changes in the database, this component automatically re-renders.
 */
function ViewData() {
  // useQuery automatically subscribes to the query result
  // Returns undefined while loading, or the data when ready
  const mockData = useQuery(api.functions.getMockData);

  // Handle loading state - show loading message while data is being fetched
  if (mockData === undefined) {
    return (
      <div>
        <h2>View Data</h2>
        <p>Loading...</p>
      </div>
    );
  }

  // Handle empty state - show message when no data exists
  if (mockData.length === 0) {
    return (
      <div>
        <h2>View Data</h2>
        <p>No data available. Seed the database with: npm run seed-data</p>
      </div>
    );
  }

  // Display data in a simple table format
  return (
    <div>
      <h2>View Data</h2>
      <p>This page displays real-time data from Convex. Changes made in the Update page will appear here instantly.</p>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {mockData.map((item: DataModel["mockData"]) => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>{item.value}</td>
              <td>{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="info-text">
        Total items: {mockData.length}
      </p>
    </div>
  );
}

export default ViewData;
