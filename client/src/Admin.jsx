import { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./Admin.css"; // Import the CSS file

export default function Admin() {
  const [password, setPassword] = useState("");
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const backend = import.meta.env.VITE_API || "https://tifekt.com";

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${backend}/api/admin/contacts`, {
        headers: {
          Authorization: `Bearer ${password}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setContacts(data.contacts);
        setLoggedIn(true);
        setError("");
      } else {
        setError(data.message || "Access denied");
      }
    } catch {
      setError("Failed to connect to server");
    }
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(contacts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "contacts.xlsx");
  };

  if (!loggedIn) {
    return (
      <div className="admin-login">
        <h1>Admin Login</h1>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={fetchContacts}>Login</button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <button onClick={downloadExcel} className="download-btn">
        Download as Excel
      </button>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.phone}</td>
              <td>{new Date(c.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
