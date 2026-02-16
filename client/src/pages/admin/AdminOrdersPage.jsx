import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiEye,
  FiDownload,
  FiRefreshCw,
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiPackage,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiShoppingCart,
  FiFileText,
  FiTruck,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import AdminSidebar from "./AdminSidebar";
import { jsPDF } from "jspdf";
import logo from "../../assades/LOGO.png";

// Color name to hex mapping for PDF swatches
const COLORS_MAP = {
  White: "#ffffff",
  Black: "#000000",
  Red: "#ff0000",
  Blue: "#007bff",
  Green: "#28a745",
  Yellow: "#ffd400",
  Purple: "#6f42c1",
  Orange: "#ff7f00",
  Pink: "#ff69b4",
  Brown: "#8b4513",
  Gray: "#6c757d",
  Navy: "#001f3f",
  Teal: "#20c997",
  Maroon: "#800000",
  Beige: "#f5f5dc",
  Olive: "#808000",
  Khaki: "#f0e68c",
  Coral: "#ff7f50",
  Turquoise: "#40e0d0",
  Lavender: "#e6e6fa",
  Mint: "#98ff98",
  Burgundy: "#800020",
  Charcoal: "#36454f",
  Cream: "#fffdd0",
  "Sky Blue": "#87ceeb",
  "Forest Green": "#228b22",
  "Hot Pink": "#ff69b4",
  Silver: "#c0c0c0",
  Gold: "#d4af37",
  Indigo: "#4b0082",
  Peach: "#ffcba4",
};

const AdminOrdersPage = () => {
  // Helper: format date as DD / MM / YYYY
  const formatDDMMYYYY = (input) => {
    const d = new Date(input);
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day} / ${month} / ${year}`;
  };

  // Helper: get customer display name with email fallback
  const getCustomerDisplayName = (order) => {
    const direct = (order.customer_name || '').trim();
    // Ignore placeholder values like "N/A" or "-" if present
    if (direct && direct.toLowerCase() !== 'n/a' && direct !== '-') return direct;
    // Some APIs may provide a combined name field under customer_info
    const combined = (order.customer_info?.name || '').trim();
    if (combined) return combined;
    const first = (order.customer_info?.firstName || '').trim();
    const last = (order.customer_info?.lastName || '').trim();
    const full = `${first} ${last}`.trim();
    if (full) return full;
    const email = (order.customer_info?.email || order.customer_email || '').trim();
    if (email) {
      const base = email.split('@')[0];
      if (base) {
        const cleaned = base.replace(/[._-]+/g, ' ');
        return cleaned
          .split(' ')
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }
    return 'N/A';
  };
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Check for mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchTerm, filterStatus, sortConfig, dateRange]);

  // Keep AdminSidebar Orders badge in sync with pending unviewed orders
  useEffect(() => {
    try {
      const viewedMap = JSON.parse(localStorage.getItem('viewed_orders') || '{}');
      const pendingUnviewed = (filteredOrders || []).filter(o => {
        const isPending = String(o.status || '').toLowerCase() === 'pending' || !o.status;
        const isViewed = !!viewedMap[o.order_id];
        return isPending && !isViewed;
      }).length;
      localStorage.setItem('new_order_count', String(pendingUnviewed));
    } catch (_) {}
  }, [filteredOrders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("https://api.yokebud.com/api/orders", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
        setFilteredOrders(data.orders || []);
      } else {
        throw new Error(data.message || "Failed to fetch orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to load orders");
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortOrders = () => {
    let result = [...orders];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.order_id.toLowerCase().includes(term) ||
          (order.customer_name &&
            order.customer_name.toLowerCase().includes(term)) ||
          (order.customer_email &&
            order.customer_email.toLowerCase().includes(term)) ||
          (order.product_name &&
            order.product_name.toLowerCase().includes(term)) ||
          (order.customer_info?.firstName &&
            order.customer_info.firstName.toLowerCase().includes(term)) ||
          (order.customer_info?.lastName &&
            order.customer_info.lastName.toLowerCase().includes(term))
      );
    }

    // Apply status filter (only filter when a specific status is selected)
    if (filterStatus) {
      result = result.filter((order) => order.status === filterStatus);
    }

    // Apply date filter
    if (dateRange.start) {
      result = result.filter(
        (order) => new Date(order.created_at) >= new Date(dateRange.start)
      );
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      result = result.filter((order) => new Date(order.created_at) <= endDate);
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested properties
        if (sortConfig.key === "customer_name") {
          aValue =
            a.customer_name ||
            `${a.customer_info?.firstName || ""} ${
              a.customer_info?.lastName || ""
            }`.trim();
          bValue =
            b.customer_name ||
            `${b.customer_info?.firstName || ""} ${
              b.customer_info?.lastName || ""
            }`.trim();
        } else if (sortConfig.key === "total") {
          aValue = a.totals?.total || 0;
          bValue = b.totals?.total || 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredOrders(result);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const response = await fetch(
        `https://api.yokebud.com/api/orders/${orderId}`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedOrder(data.order);
          setShowOrderModal(true);

          // Mark this order as viewed in localStorage
          try {
            const viewedKey = 'viewed_orders';
            const viewedMap = JSON.parse(localStorage.getItem(viewedKey) || '{}');
            viewedMap[orderId] = true;
            localStorage.setItem(viewedKey, JSON.stringify(viewedMap));

            // Update new order count for AdminSidebar badge
            const pendingUnviewed = (filteredOrders || []).filter(o => {
              const isPending = String(o.status || '').toLowerCase() === 'pending' || !o.status;
              const isViewed = !!viewedMap[o.order_id];
              return isPending && !isViewed;
            }).length;
            localStorage.setItem('new_order_count', String(pendingUnviewed));
          } catch (e) {
            // non-blocking
          }
        }
      } else {
        throw new Error("Failed to fetch order details");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("Failed to load order details");
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `https://api.yokebud.com/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ 
            status: newStatus,
            // send delivered_at when marking as Delivered (backend may ignore)
            delivered_at: newStatus === "Delivered" ? new Date().toISOString() : undefined
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Ensure delivered_at is present locally when Delivered
          const updatedOrder = { 
            ...(data.order || {}),
            ...(newStatus === "Delivered" && !data.order?.delivered_at
              ? { delivered_at: new Date().toISOString() }
              : {})
          };
          // Update the orders list
          setOrders(
            orders.map((order) =>
              order.order_id === orderId ? updatedOrder : order
            )
          );
          // Update the selected order if it's the one being viewed
          if (selectedOrder && selectedOrder.order_id === orderId) {
            setSelectedOrder(updatedOrder);
          }
        }
      } else {
        throw new Error("Failed to update order status");
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      setError("Failed to update order status");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Email",
      "Phone",
      "Product",
      "Quantity",
      "Total Amount",
      "Status",
      "Payment Method",
    ].join(",");

    const csvData = filteredOrders.map((order) => {
      const customerName =
        order.customer_name ||
        `${order.customer_info?.firstName || ""} ${
          order.customer_info?.lastName || ""
        }`.trim();
      const productName =
        order.product_name ||
        (order.items && order.items[0]?.product_name) ||
        "N/A";
      const quantity =
        order.items && order.items[0]?.quantity
          ? order.items[0].quantity
          : order.customization_data?.quantity || 1;
      const total = order.totals?.total || "0";

      return [
        order.order_id,
        new Date(order.created_at).toLocaleDateString(),
        `"${customerName}"`, // Enclose in quotes to handle commas in names
        order.customer_email || order.customer_info?.email,
        order.customer_phone || order.customer_info?.phone,
        `"${productName.replace(/"/g, '""')}"`, // Handle quotes in product names
        quantity,
        `"${total}"`, // Keep currency format consistent
        order.status,
        order.payment_method,
      ].join(",");
    });

    const csv = [headers, ...csvData].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `yokebud-orders-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateOrderPDF = async (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth ? doc.internal.pageSize.getWidth() : 210;

    // Header with centered Yokebud logo above title
    const toDataURL = async (url) => {
      try {
        const res = await fetch(url, { mode: "cors" });
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        return null;
      }
    };
    const logoDataUrl = await toDataURL(logo);
    let titleY = 30;
    let infoY = 40;
    if (logoDataUrl) {
      const logoW = 34; // slightly bigger logo
      const logoH = 34;
      const logoX = (pageWidth - logoW) / 2;
      // Place logo closer to the very top
      const logoY = 2;
      doc.addImage(logoDataUrl, "JPEG", logoX, logoY, logoW, logoH);
      // Reduce gap between logo and title for tighter header
      titleY = logoY + logoH - 4; // pull title 4px closer to logo
      infoY = titleY + 12;         // slightly tighter gap below title
    }
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0); // Title now black
    doc.setFont("helvetica", "bold");
    doc.text("Manufacturing Sheet", 105, titleY, null, null, "center");
    doc.setFont("helvetica", "normal");

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Order #${order.order_id}`, 14, infoY);
    // Move date to right column (right-aligned)
    // Show today's date at time of PDF download
    doc.text(
      `Date: ${formatDDMMYYYY(new Date())}`,
      196,
      infoY,
      null,
      null,
      "right"
    );
    // underline below order and date section to separate header
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(14, infoY + 6, 196, infoY + 6);
    
    // Dynamic professional layout begins
    let y = infoY + 14;
    const lineGap = 4; // default line spacing
    const slotLineGap = 8; // slightly larger spacing inside slots for readability
    const sectionGap = 7; // optimized gap between sections
    const slotGap = 10; // extra space between customization slots (increased for better separation)
    const leftX = 14;
    const rightX = 110; // right column start
    const rightColWidth = 196 - rightX - 2; // available width for wrapping
    const leftColWidth = rightX - leftX - 4;
    const wrap = (t, w) => doc.splitTextToSize(String(t), w);

    // font helpers
    const setHeadingFont = () => doc.setFont("helvetica", "bold");
    const setBodyFont = () => doc.setFont("helvetica", "normal");

    // Section header: black color, slightly larger to distinguish
    const addSectionHeader = (title) => {
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.line(14, y, 196, y);
      y += 6;
      doc.setFontSize(12); // slightly smaller for professional print
      setHeadingFont();
      doc.setTextColor(0, 0, 0); // headings in black
      doc.text(title, leftX, y);
      y += 8; // extra margin below heading
      doc.setFontSize(10);
      setBodyFont();
      doc.setTextColor(0, 0, 0);
    };

    // Generic two-column renderer for simple lists
    const renderTwoColumn = (leftTitle, leftLines, rightTitle, rightLines) => {
      // header line and titles on same baseline
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.line(14, y, 196, y);
      y += 6;

      doc.setFontSize(12);
      setHeadingFont();
      doc.setTextColor(0, 0, 0);
      doc.text(leftTitle, leftX, y);
      doc.text(rightTitle, rightX, y);
      y += 8; // margin under headings

      doc.setFontSize(10);
      setBodyFont();
      doc.setTextColor(0, 0, 0);

      let yLeft = y;
      let yRight = y;

      leftLines.forEach((ln) => {
        if (!ln) return;
        const wrapped = Array.isArray(ln) ? ln : wrap(ln, leftColWidth);
        wrapped.forEach((wln) => { doc.text(String(wln), leftX, yLeft); yLeft += lineGap; });
      });
      rightLines.forEach((ln) => {
        if (!ln) return;
        const wrapped = Array.isArray(ln) ? ln : wrap(ln, rightColWidth);
        wrapped.forEach((wln) => { doc.text(String(wln), rightX, yRight); yRight += lineGap; });
      });

      y = Math.max(yLeft, yRight) + sectionGap;
    };

    // Shipping Address (left) and Items (right)
    const shipping = order.shipping_address || order.customer_info || {};
    const leftLines = [];
    if (shipping.address) leftLines.push(String(shipping.address));
    const cityLine = [shipping.city, shipping.state, shipping.zip]
      .filter(Boolean)
      .join(", ");
    if (cityLine) leftLines.push(cityLine);
    if (shipping.country) leftLines.push(String(shipping.country));

    const rightLines = [];
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      order.items.forEach((item) => {
        const name = item.product_name || item.name || "Product";
        const qty = item.quantity || order.customization_data?.quantity || 1;
        rightLines.push(wrap(`${name} x ${qty}`, rightColWidth));
      });
    } else {
      const name = order.product_name || "Product";
      const qty = order.customization_data?.quantity || 1;
      rightLines.push(wrap(`${name} x ${qty}`, rightColWidth));
    }

    renderTwoColumn("Shipping Address", leftLines, "Items", rightLines);

    // Detailed Items table with Photo / Product / MOQ / Unit

    // table position and layout
    let itemsY = y;
    const tableX = 14;
    const tableWidth = 196 - tableX;
    const pageHeight = doc.internal.pageSize.getHeight ? doc.internal.pageSize.getHeight() : 297;
    const renderItemsHeader = () => {
      doc.setFillColor(240, 240, 240);
      doc.rect(tableX, itemsY, tableWidth, 8, "F");
      doc.setFontSize(10);
      setHeadingFont();
      doc.text("Photo", col.imgX + 2, itemsY + 6);
      doc.text("Product", col.nameX + 2, itemsY + 6);
      doc.text("MOQ", col.moqX + 2, itemsY + 6);
      doc.text("Slots", col.slotsX + 2, itemsY + 6);
      itemsY += 10;
      setBodyFont();
    };
    const imgCellW = 36; // enlarge photo cell width
    const col = {
      imgX: tableX,
      imgW: imgCellW,
      nameX: tableX + imgCellW + 6,
      nameW: 92, // slightly reduced to make room for bigger image
      moqX: tableX + imgCellW + 6 + 92,
      moqW: 22,
      // shrink Slots column and nudge right with small gap
      slotsX: tableX + imgCellW + 6 + 92 + 22 + 6,
      slotsW: 18,
    };

    // header row
    renderItemsHeader();

    const normalizedItems = (order.items && Array.isArray(order.items) && order.items.length > 0)
      ? order.items.map((it) => ({
          name: it.product_name || it.name || "Item",
          moq: it.moq || order.moq || 1,
          product_photos: it.product_photos || [],
        }))
      : [{
          name: order.product_name || "Item",
          moq: order.moq || order.customization_data?.quantity || 1,
          product_photos: order.product_photos || [],
        }];

    for (let idx = 0; idx < normalizedItems.length; idx++) {
      const it = normalizedItems[idx];
      const truncateLines = (text, width, maxLines) => {
        const lines = doc.splitTextToSize(String(text), width);
        if (lines.length <= maxLines) return lines;
        const cut = lines.slice(0, maxLines);
        cut[maxLines - 1] = `${cut[maxLines - 1].replace(/\s+$/, "")}…`;
        return cut;
      };
      const nameLines = truncateLines(it.name, col.nameW, 2);
      const imgSize = 34; // enlarged image size
      const rowH = Math.max(imgSize, nameLines.length * 6 + 6);

      // page break if row exceeds page
      if (itemsY + rowH > pageHeight - 24) {
        doc.addPage();
        itemsY = 20;
        renderItemsHeader();
      }
      // separator line for row
      doc.setDrawColor(230, 230, 230);
      doc.line(tableX, itemsY + rowH, 196, itemsY + rowH);

      // image
      let photo = null;
      if (Array.isArray(it.product_photos) && it.product_photos.length) photo = it.product_photos[0];
      if (typeof it.product_photos === "string") {
        try { const arr = JSON.parse(it.product_photos); if (Array.isArray(arr) && arr.length) photo = arr[0]; } catch {}
      }
      if (photo && typeof photo === "string") {
        const dataUrl = await toDataURL(photo);
        if (dataUrl) { try { doc.addImage(dataUrl, "JPEG", col.imgX + 2, itemsY + 2, imgSize, imgSize); } catch {} }
      }

      // product name
      doc.text(nameLines, col.nameX, itemsY + 6);
      // MOQ
      doc.text(String(it.moq || 1), col.moqX + 2, itemsY + 6);
      // Total slots count (from customization_data)
      const slotsCount = Array.isArray(order?.customization_data?.customizationData?.slots)
        ? order.customization_data.customizationData.slots.length
        : 0;
      doc.text(String(slotsCount), col.slotsX + 2, itemsY + 6);

      itemsY += rowH;
    }

    // divider after table and breathing space before Customization Details
    doc.setDrawColor(230, 230, 230);
    doc.line(14, itemsY + 4, 196, itemsY + 4);
    y = itemsY + 12;

    // Customization Details in two columns
    if (order.customization_data) {
      addSectionHeader("Customization Details");
      // extra margin below the section title for cleaner separation
      y += 4;
      const notes = order.customization_data.notes;
      if (notes) { doc.text(`Notes: ${notes}`, leftX, y); y += lineGap; }

      const slots = order.customization_data.customizationData?.slots || [];
      const mid = Math.ceil(slots.length / 2);
      const leftSlots = slots.slice(0, mid);
      const rightSlots = slots.slice(mid);

      let yLeft = y;
      let yRight = y;

      const drawSlot = (slot, idx, baseX, currY) => {
        const estimate = 6 * 6; // approx lines height per slot
        if (currY + estimate > pageHeight - 24) {
          doc.addPage();
          currY = 20;
        }
        // top margin before the slot header
        currY += 6;
        doc.text(`Slot ${idx}: ${slot.quantity} units`, baseX, currY); currY += slotLineGap;
        if (slot.color || slot.customColor) {
          doc.text(`Color: ${slot.color || slot.customColor}`, baseX + 6, currY);
          // draw swatch for either hex custom color or known named colors
          try {
            let hexColor = null;
            if (slot.customColor && /^#?[0-9A-Fa-f]{6}$/.test(slot.customColor)) {
              hexColor = slot.customColor;
            } else if (slot.color && COLORS_MAP[slot.color]) {
              hexColor = COLORS_MAP[slot.color];
            }
            if (hexColor) {
              const hex = hexColor.replace('#', '');
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              doc.setFillColor(r, g, b);
              doc.rect(baseX + 60, currY - 4, 6, 6, 'F');
              doc.setFillColor(255, 255, 255);
            }
          } catch (e) { /* ignore parsing issues */ }
          currY += slotLineGap;
        }
        const sizeKeys = slot.sizes ? Object.keys(slot.sizes) : [];
        if (sizeKeys.length) {
          doc.setFont("helvetica", "bold");
          doc.text("Size Breakdown:", baseX + 6, currY);
          doc.setFont("helvetica", "normal");
          currY += slotLineGap;
          const sizeLine = sizeKeys.map((size) => `${size}: ${slot.sizes[size]}`).join("; ");
          doc.text(sizeLine, baseX + 11, currY);
          currY += slotLineGap;
        }
        if (slot.notes) {
          const w = baseX === leftX ? leftColWidth : rightColWidth;
          const wrappedNotes = wrap(`Slot Notes: ${slot.notes}`, w - 8);
          wrappedNotes.forEach((n) => { doc.text(String(n), baseX + 6, currY); currY += slotLineGap; });
        }
        // add visual breathing room after each slot
        return currY + slotGap;
      };

      leftSlots.forEach((slot, i) => { yLeft = drawSlot(slot, i + 1, leftX, yLeft); });
      rightSlots.forEach((slot, i) => { yRight = drawSlot(slot, mid + i + 1, rightX, yRight); });

      // add consistent bottom margin after customization block
      y = Math.max(yLeft, yRight) + sectionGap;
    }



    // Save the PDF
    doc.save(`manufacturing-order-${order.order_id}.pdf`);
  };

  const generateDeliveryPDF = async (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth ? doc.internal.pageSize.getWidth() : 210;

    // Add logo at the very top and bold title under it
    const toDataURL = async (url) => {
      try {
        const res = await fetch(url, { mode: "cors" });
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        return null;
      }
    };

    const logoDataUrl = await toDataURL(logo);
    let titleY = 22;
    let infoY = 36;
    if (logoDataUrl) {
      const logoW = 34;
      const logoH = 34;
      const logoX = (pageWidth - logoW) / 2;
      const logoY = 2;
      doc.addImage(logoDataUrl, "JPEG", logoX, logoY, logoW, logoH);
      // Reduce gap between logo and title
      titleY = logoY + logoH - 4; // pull title up
      infoY = titleY + 10;        // keep tight spacing
    }

    // Title (bold)
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Delivery Note", 105, titleY, null, null, "center");
    // reset font for body
    doc.setFont("helvetica", "normal");

    // Company info (left column)
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("Yokebud Limited", 14, infoY);
    doc.text("Pukinmäenaukio 4", 14, infoY + 6);
    doc.text("00720 Helsinki, Finland", 14, infoY + 12);
    doc.text("Phone: +358 440 328 124", 14, infoY + 18);
    doc.text("Email: yokebud@gmail.com", 14, infoY + 24);

    // Order info (right column)
    doc.setFontSize(10);
    doc.text(`Order #: ${order.order_id}`, 125, infoY);
    doc.text(`Date: ${formatDDMMYYYY(new Date())}`, 125, infoY + 6);
    doc.text(`Status: ${order.status}`, 125, infoY + 12);

    // Divider line below header
    doc.setDrawColor(255, 165, 0);
    doc.setLineWidth(0.5);
    doc.line(14, infoY + 30, 196, infoY + 30);

    // Delivery address
    doc.setFontSize(12);
    doc.text("Delivery Address", 14, infoY + 40);

    doc.setFontSize(10);
    const customerName =
      order.customer_name ||
      `${order.customer_info?.firstName || ""} ${
        order.customer_info?.lastName || ""
      }`.trim();
    const shipping = order.shipping_address || order.customer_info;

    doc.text(customerName, 14, infoY + 48);
    doc.text(shipping.address, 14, infoY + 54);
    doc.text(`${shipping.city}, ${shipping.state} ${shipping.zip}`, 14, infoY + 60);
    doc.text(shipping.country, 14, infoY + 66);
    doc.text(
      `Phone: ${order.customer_info?.phone || order.customer_phone}`,
      14,
      infoY + 72
    );

    // Order items
    doc.setFontSize(12);
    doc.text("Order Items", 14, infoY + 84);

    doc.setFontSize(10);
    let yPos = infoY + 92;

    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        const itemName = item.product_name || item.name || "Product";
        const quantity =
          item.quantity || order.customization_data?.quantity || 1;

        doc.text(`${itemName} x ${quantity}`, 14, yPos);
        yPos += 8;
      });
    } else {
      const productName = order.product_name || "Product";
      const quantity = order.customization_data?.quantity || 1;

      doc.text(`${productName} x ${quantity}`, 14, yPos);
      yPos += 8;
    }

    // Customization Details (formatted)
    if (order.customization_data?.customizationData) {
      const customData = order.customization_data.customizationData;
      const slotLineGap = 8;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Customization Details", 14, yPos + 10);
      // extra margin under section title
      yPos += 14;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      (customData.slots || []).forEach((slot, index) => {
        // Add top margin before each slot to create separation
        yPos += 6;
        // Slot header
        doc.text(`Slot ${index + 1}: ${slot.quantity} units`, 14, yPos);
        yPos += slotLineGap;

        // Color line + swatch for hex or known named colors
        const colorLabel = slot.color || slot.customColor;
        if (colorLabel) {
          doc.text(`Color: ${colorLabel}`, 20, yPos);
          try {
            let r = null, g = null, b = null;
            if (slot.customColor && /^#?[0-9A-Fa-f]{6}$/.test(slot.customColor)) {
              const hex = slot.customColor.replace('#', '');
              r = parseInt(hex.substring(0, 2), 16);
              g = parseInt(hex.substring(2, 4), 16);
              b = parseInt(hex.substring(4, 6), 16);
            } else if (slot.color && COLORS_MAP[slot.color]) {
              const hex = COLORS_MAP[slot.color].replace('#', '');
              r = parseInt(hex.substring(0, 2), 16);
              g = parseInt(hex.substring(2, 4), 16);
              b = parseInt(hex.substring(4, 6), 16);
            }
            if (r !== null) {
              doc.setFillColor(r, g, b);
              doc.rect(90, yPos - 4, 6, 6, 'F');
              doc.setFillColor(255, 255, 255);
            }
          } catch (e) { /* ignore */ }
          yPos += slotLineGap;
        }

        // Sizes inline with semicolons
        const sizeKeys = slot.sizes ? Object.keys(slot.sizes) : [];
        if (sizeKeys.length) {
          doc.setFont("helvetica", "bold");
          doc.text("Size Breakdown:", 20, yPos);
          doc.setFont("helvetica", "normal");
          yPos += slotLineGap;
          const sizeLine = sizeKeys.map((s) => `${s}: ${slot.sizes[s]}`).join('; ');
          doc.text(sizeLine, 25, yPos);
          yPos += slotLineGap;
        }

        // slot notes
        if (slot.notes) {
          doc.text(wrap(`Notes: ${slot.notes}`, 150), 20, yPos);
          yPos += slotLineGap;
        }

        // spacing after each slot
        yPos += 10;
      });
    }

    // Delivery notes
    doc.setFontSize(12);
    doc.text("Delivery Notes", 14, yPos + 10);
    yPos += 18;
    
    doc.setFontSize(10);
    doc.text("Please handle with care.", 14, yPos);
    doc.text("Customer must check items before signing.", 14, yPos + 8);
    doc.text(
      "For any issues, contact Yokebud customer service.",
      14,
      yPos + 16
    );

    // Signature line
    doc.setFontSize(14);
    doc.text("Customer Signature", 14, yPos + 40);
    doc.line(14, yPos + 42, 80, yPos + 42);

    doc.text("Delivery Person", 120, yPos + 40);
    doc.line(120, yPos + 42, 180, yPos + 42);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for choosing Yokebud!", 105, 280, null, null, "center");

    // Save the PDF
    doc.save(`delivery-note-${order.order_id}.pdf`);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("https://api.yokebud.com/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        window.location.href = "/admin/login";
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Helper function to get product image
  const getProductImage = (order) => {
    if (order.product_photos) {
      const photos =
        typeof order.product_photos === "string"
          ? JSON.parse(order.product_photos)
          : order.product_photos;
      return photos[0];
    }
    if (order.items && order.items[0]?.product_photos) {
      const photos =
        typeof order.items[0].product_photos === "string"
          ? JSON.parse(order.items[0].product_photos)
          : order.items[0].product_photos;
      return photos[0];
    }
    return null;
  };

  // Helper function to get product quantity
  const getProductQuantity = (order) => {
    if (order.items && order.items[0]?.quantity) {
      return order.items[0].quantity;
    }
    if (order.customization_data?.quantity) {
      return order.customization_data.quantity;
    }
    if (order.customization_data?.customizationData?.quantity) {
      return order.customization_data.customizationData.quantity;
    }
    return 1;
  };

  // Helper function to get product price
  const getProductPrice = (order) => {
    if (order.items && order.items[0]) {
      const item = order.items[0];
      return item.discounted_price || item.price || 0;
    }
    return order.totals?.total || 0;
  };

  // Styles
  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#18181B", // Darker, more modern bg
      color: "#F4F4F5", // Brighter default text
      fontFamily:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      overflowX: "hidden",
      width: "100vw",
    },
    mainContent: {
      flex: 1,
      marginLeft: isMobile ? 0 : "250px",
      padding: isMobile ? "1rem" : "0rem 1rem", // Increased padding
      width: isMobile ? "100%" : "calc(100% - 230px)",
      minWidth: 0,
      backgroundColor: "transparent", // Inherit from container
      transition: "margin-left 0.3s ease",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "center",
      marginBottom: "0.8rem", // Increased margin
      marginTop: "1rem",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "1rem" : 0,
    },
    title: {
      fontSize: isMobile ? "1rem" : "1.3rem", // Larger title
      fontWeight: "700", // Bolder
      background: "linear-gradient(90deg, #FFA500, #FFC371)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      margin: 0,
    },
    logoutBtn: {
      padding: "8px 8px",
      backgroundColor: "#3F3F46", // Suble dark gray
      border: "none",
      fontSize: "13px",
      display: isMobile ? "none" : "inline",
      borderRadius: "8px", // Softer radius
      color: "#F4F4F5",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s ease, transform 0.2s ease",
      ":hover": {
        backgroundColor: "#52525B", // Slightly lighter gray
        transform: "scale(1.03)",
      },
    },
    date: {
      color: "#A1A1AA", // Muted text
      fontSize: isMobile ? "0.7rem" : "0.8rem",
      fontWeight: "400",
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "65vh",
      flexDirection: "column",
    },
    loadingRing: {
      display: "inline-block",
      width: "80px",
      height: "80px",
      "&:after": {
        content: '""',
        display: "block",
        width: "64px",
        height: "64px",
        margin: "8px",
        borderRadius: "50%",
        border: "6px solid #FFA500",
        borderColor: "#FFA500 transparent #FFA500 transparent",
        animation: "loading-ring 1.2s linear infinite",
      },
    },
    loadingText: {
      marginTop: "20px",
      color: "#FFA500",
      fontSize: "1.2rem",
      fontWeight: "500",
    },
    error: {
      color: "#F87171", // Softer red
      textAlign: "center",
      padding: "1.5rem",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderRadius: "8px",
      margin: "1rem 0",
      border: "1px solid rgba(239, 68, 68, 0.2)",
    },
    filtersContainer: {
      backgroundColor: "#27272A", // Lighter dark card
      borderRadius: "12px",
      padding: "1rem",
      marginBottom: "0.5rem",
      border: "1px solid #3F3F46", // Subtle border
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },
    filtersHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: showFilters ? "1.5rem" : 0,
      cursor: "pointer",
    },
    filtersTitle: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem", // Increased gap
      color: "#FFA500",
      fontWeight: "600",
      fontSize: "1rem",
    },
    filtersContent: {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1rem",
      overflow: "hidden",
      transition: "max-height 0.3s ease",
      maxHeight: showFilters ? "500px" : "0",
    },
    searchBox: {
      position: "relative",
      display: "flex",
      alignItems: "center",
    },
    searchIcon: {
      position: "absolute",
      left: "14px",
      color: "#A1A1AA",
    },
    searchInput: {
      padding: "12px 14px 12px 42px", // Taller input
      backgroundColor: "#18181B", // Darker input bg
      border: "1px solid #3F3F46",
      borderRadius: "8px",
      color: "#F4F4F5",
      width: "100%",
      fontSize: "0.9rem",
      "::placeholder": {
        color: "#71717A",
      },
    },
    filterGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    },
    filterLabel: {
      fontSize: "0.875rem",
      color: "#A1A1AA",
      fontWeight: "500",
    },
    filterSelect: {
      padding: "12px 14px",
      backgroundColor: "#18181B",
      border: "1px solid #3F3F46",
      borderRadius: "8px",
      color: "#F4F4F5",
      cursor: "pointer",
      fontSize: "0.9rem",
    },
    dateInput: {
      padding: "11px 14px", // Adjust padding for date picker
      backgroundColor: "#18181B",
      border: "1px solid #3F3F46",
      borderRadius: "8px",
      color: "#F4F4F5",
      width: "100%",
      fontSize: "0.9rem",
    },
    actionButtons: {
      display: "flex",
      gap: "1rem",
      justifyContent: isMobile ? "stretch" : "flex-end",
      alignItems: "center",
      marginTop: isMobile ? "1rem" : "auto", // Align to bottom on desktop
      flexDirection: isMobile ? "column" : "row",
    },
    actionButton: (color) => ({
      padding: "10px 16px",
      backgroundColor: color,
      border: "none",
      borderRadius: "8px",
      fontSize: "0.7rem",
      color: "#fff",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      transition: "transform 0.2s ease, opacity 0.2s ease",
      ":hover": {
        transform: "scale(1.03)",
        opacity: 0.9,
      },
      width: isMobile ? "100%" : "auto",
    }),
    ordersCard: {
      background: "#27272A",
      borderRadius: "12px",
      padding: "0", // Padding will be on the header/table
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      border: "1px solid #3F3F46",
      // marginBottom: '0.5rem',
      overflow: "hidden", // Clip table corners
    },
    ordersHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: isMobile ? "0" : "1rem",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "1rem" : 0,
      padding: isMobile ? "0" : "1.5rem 1.5rem 0 1.5rem", // Padding for header
    },
    resultsCount: {
      color: "#A1A1AA",
      fontSize: "0.9rem",
      display: isMobile ? "none" : "inline",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "800px",
    },
    thead: {
      position: "sticky",
      top: 0,
      backgroundColor: "#27272A",
      zIndex: 2,
    },
    // Wrapper to keep scrollbar inside the table area
    tableWrapper: {
      overflowX: "auto",
      overflowY: "auto",
      // Set a viewport-based height so page doesn’t scroll
      height: isMobile ? "80vh" : "70vh",
    },
    th: {
      padding: "14px 16px",
      textAlign: "left",
      borderBottom: "2px solid #3F3F46",
      color: "#FFA500", // Accent color for headers
      fontWeight: "600",
      fontSize: "0.75rem",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      cursor: "pointer",
      userSelect: "none",
      backgroundColor: "rgba(255, 165, 0, 0.05)",
      transition: "background-color 0.2s ease",
      ":hover": {
        backgroundColor: "rgba(255, 165, 0, 0.1)",
      },
    },
    td: {
      padding: "15px",
      textAlign: "left",
      borderBottom: "1px solid #3F3F46",
      color: "#F4F4F5",
      transition: "background-color 0.2s ease",
      fontSize: "0.9rem",
    },
    "tr:hover td": {
      backgroundColor: "rgba(255, 165, 0, 0.02)",
    },
    status: (status) => ({
      padding: "0.4rem 0.8rem",
      borderRadius: "16px",
      fontSize: "0.7rem",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      transition: "all 0.2s ease",
      ":before": {
        content: '""',
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor:
          status === "Delivered"
            ? "#4CAF50"
            : status === "Pending" || status === "New order"
            ? "#FFC107"
            : status === "Processing"
            ? "#2196F3"
            : status === "Shipped"
            ? "#9C27B0"
            : "#F44336",
      },
      background:
        status === "Delivered"
          ? "rgba(76, 175, 80, 0.15)"
          : status === "Pending" || status === "New order"
          ? "rgba(255, 193, 7, 0.15)"
          : status === "Processing"
          ? "rgba(33, 150, 243, 0.15)"
          : status === "Shipped"
          ? "rgba(156, 39, 176, 0.15)"
          : "rgba(244, 67, 54, 0.15)",
      color:
        status === "Delivered"
          ? "#4CAF50"
          : status === "Pending" || status === "New order"
          ? "#FFC107"
          : status === "Processing"
          ? "#2196F3"
          : status === "Shipped"
          ? "#9C27B0"
          : "#F44336",
      border: "1px solid",
      borderColor:
        status === "Delivered"
          ? "rgba(76, 175, 80, 0.3)"
          : status === "Pending" || status === "New order"
          ? "rgba(255, 193, 7, 0.3)"
          : status === "Processing"
          ? "rgba(33, 150, 243, 0.3)"
          : status === "Shipped"
          ? "rgba(156, 39, 176, 0.3)"
          : "rgba(244, 67, 54, 0.3)",
    }),
    customerInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "0.2rem",
    },
    customerName: {
      fontWeight: "600",
      color: "#F4F4F5",
      fontSize: "0.9rem",
    },
    customerEmail: {
      fontSize: "0.8rem",
      color: "#A1A1AA",
      fontWeight: "400",
    },
    productName: {
      maxWidth: "200px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    totalAmount: {
      fontWeight: "600",
      color: "#FFA500", // Changed from gold to primary accent
    },
    viewButton: {
      background: "linear-gradient(135deg, #FFA500, #FF8C00)",
      border: "none",
      borderRadius: "8px",
      padding: "0.6rem 1.2rem",
      color: "#18181B",
      fontWeight: "600",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.8rem",
      transition: "all 0.3s ease",
      boxShadow: "0 2px 8px rgba(255, 165, 0, 0.3)",
      ":hover": {
        transform: "translateY(-1px)",
        boxShadow: "0 4px 16px rgba(255, 165, 0, 0.4)",
        background: "linear-gradient(135deg, #FF8C00, #FFA500)",
      },
      ":active": {
        transform: "translateY(0)",
        boxShadow: "0 2px 4px rgba(255, 165, 0, 0.3)",
      },
    },
    noOrders: {
      textAlign: "center",
      padding: "3rem",
      color: "#A1A1AA",
      fontSize: "1.1rem",
    },
    sortIndicator: {
      marginLeft: "0.3rem",
      fontSize: "0.8rem",
      color: "#FFA500", // Match accent
    },
  };

  // CSS for the loading ring animation
  const loadingRingStyle = `
    @keyframes loading-ring {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;

  // --- Modal Styles ---
  // We create a separate object for modal styles for clarity
  // as they are complex and only used in the modal.
  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)", // Darker overlay
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: isMobile ? "1rem" : 0,
    },
    modal: {
      backgroundColor: "#18181B", // Darker modal bg
      borderRadius: "16px", // Larger radius
      padding: isMobile ? "1.5rem" : "2rem",
      maxWidth: "85%",
      width: "100%",
      maxHeight: "95vh",
      // Make the top section fixed and only the content scrollable
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      margin: isMobile ? "1rem" : 0,
      border: "1px solid #3F3F46",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      color: "#F4F4F5",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1.5rem",
      borderBottom: "1px solid #3F3F46",
      paddingBottom: "1.5rem",
    },
    // Fixed top actions under header: shows status badge + actions
    topBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "0.75rem",
      paddingBottom: "1rem",
      borderBottom: "1px solid #3F3F46",
      marginBottom: "1rem",
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    // New header layout pieces
    headerLeft: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    },
    statusRow: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    headerRight: {
      display: "flex",
      alignItems: "center",
      gap: "4.75rem",
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    topBarLeft: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    topBarRight: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    // Scrollable content area below the fixed header/topBar
    contentScroll: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
    },
    headerTitle: {
      color: "#FFA500",
      margin: 0,
      fontSize: "0.8rem",
      fontWeight: "700",
    },
    closeButton: {
      background: "#27272A",
      border: "1px solid #3F3F46",
      color: "#FFA500",
      fontSize: "24px",
      cursor: "pointer",
      padding: "0",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
      lineHeight: "36px",
      transition: "background-color 0.2s ease, transform 0.2s ease",
      ":hover": {
        backgroundColor: "#3F3F46",
        transform: "rotate(90deg)",
      },
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1rem",
      marginBottom: "2rem",
    },
    summaryCard: (accentColor) => ({
      background: "#27272A",
      padding: "1rem",
      borderRadius: "12px",
      border: "1px solid #3F3F46",
      borderLeft: `4px solid ${accentColor}`,
    }),
    summaryCardHeader: (accentColor) => ({
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      marginBottom: "0.5rem",
      color: accentColor,
      fontWeight: "600",
      fontSize: "0.9rem",
    }),
    summaryCardValue: {
      color: "white",
      fontWeight: "600",
      fontSize: "1.25rem",
    },
    contentGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "2rem",
      marginBottom: "2rem",
    },
    section: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    sectionTitle: {
      color: "#FFA500",
      marginBottom: "0",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      fontSize: "1.25rem",
      borderBottom: "1px solid #3F3F46",
      paddingBottom: "0.75rem",
    },
    sectionContent: {
      backgroundColor: "#27272A",
      padding: "1.5rem",
      borderRadius: "12px",
      border: "1px solid #3F3F46",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },
    infoRow: {
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
    },
    infoLabel: {
      color: "#A1A1AA",
      fontWeight: "500",
      fontSize: "0.875rem",
    },
    infoValue: {
      color: "white",
      fontWeight: "500",
      fontSize: "1rem",
    },
    itemCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "1rem",
      backgroundColor: "#18181B", // Darker than section bg
      borderRadius: "8px",
      border: "1px solid #3F3F46",
    },
    itemDetails: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    },
    itemImage: {
      width: "50px",
      height: "50px",
      objectFit: "cover",
      borderRadius: "6px",
      border: "1px solid #3F3F46",
    },
    itemName: {
      color: "white",
      fontWeight: "600",
    },
    itemQty: {
      color: "#A1A1AA",
      fontSize: "0.875rem",
    },
    itemPrice: {
      color: "#FFA500",
      fontWeight: "700",
      fontSize: "1rem",
      display:'flex',
      gap:'20px'
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: "1rem",
      marginTop: "1rem",
      borderTop: "1px solid #3F3F46",
    },
    totalLabel: {
      color: "#FFA500",
      fontWeight: "700",
      fontSize: "1rem",
    },
    totalValue: {
      color: "#FFA500",
      fontWeight: "700",
      fontSize: "1.2rem",
    },
    customizationSlot: {
      marginBottom: "1rem",
      padding: "1rem",
      backgroundColor: "#18181B",
      borderRadius: "8px",
      border: "1px solid #3F3F46",
    },
    slotHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "0.75rem",
    },
    slotTitle: {
      color: "#FFA500",
      fontWeight: "600",
      fontSize: "1.1rem",
    },
    slotColor: {
      color: "white",
      fontSize: "0.9rem",
      padding: "4px 10px",
      backgroundColor: "rgba(255, 165, 0, 0.1)",
      borderRadius: "20px",
      border: "1px solid rgba(255, 165, 0, 0.2)",
    },
    sizeGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: "0.5rem",
      marginTop: "0.75rem",
    },
    sizePill: {
      padding: "4px 10px",
      backgroundColor: "#3F3F46",
      borderRadius: "20px",
      fontSize: "0.8rem",
      color: "white",
    },
    slotNotes: {
      color: "#A1A1AA",
      fontSize: "0.9rem",
      marginTop: "0.75rem",
      paddingLeft: "0.5rem",
      borderLeft: "2px solid #FFA500",
    },
    footer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "2rem",
      paddingTop: "1.5rem",
      borderTop: "1px solid #3F3F46",
      flexDirection: isMobile ? "column" : "row",
      gap: "1rem",
    },
    footerActions: {
      display: "flex",
      gap: "0.75rem",
      flexDirection: isMobile ? "column" : "row",
      width: isMobile ? "100%" : "auto",
    },
    footerButton: (bgColor, textColor = "white") => ({
      padding: "10px 10px",
      backgroundColor: bgColor,
      color: textColor,
      border: "none",
      borderRadius: "8px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      fontSize: "0.7rem",
      alignItems: "center",
      gap: "0.5rem",
      transition: "opacity 0.2s ease",
      width: isMobile ? "100%" : "auto",
      ":hover": {
        opacity: 0.9,
      },
    }),
    // Modern gradient button used for download actions
    modernButton: (startColor, endColor, textColor = "#18181B") => ({
      padding: "12px 16px",
      backgroundImage: `linear-gradient(135deg, ${startColor}, ${endColor})`,
      color: textColor,
      border: "none",
      borderRadius: "10px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.6rem",
      boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
      transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
      fontSize: "0.85rem",
      width: isMobile ? "100%" : "auto",
    }),
    statusUpdateGroup: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      flexDirection: isMobile ? "column" : "row",
      width: isMobile ? "100%" : "auto",
    },
    statusUpdateLabel: {
      color: "#FFA500",
      fontWeight: "600",
      fontSize: "0.8rem",
    },
    statusUpdateSelect: {
      padding: "12px 14px",
      backgroundColor: "#27272A",
      color: "#F4F4F5",
      border: "1px solid #3F3F46",
      borderRadius: "8px",
      minWidth: "150px",
      width: isMobile ? "100%" : "auto",
    },
  };

  return (
    <div style={styles.container}>
      <style>{loadingRingStyle}</style>
      <style>{`
        /* Modern Scrollbar Design */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #18181B;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #FFA500, #FF8C00);
          border-radius: 4px;
          border: 2px solid #18181B;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #FF8C00, #FF7F00);
        }
        
        /* Firefox scrollbar */
        * {
          scrollbar-width: thin;
          scrollbar-color: #ffa5005e #18181B;
        }
        
        /* Table scrollbar specific */
        div[style*="overflow-x: auto"]::-webkit-scrollbar {
          height: 6px;
        }
        
        div[style*="overflow-x: auto"]::-webkit-scrollbar-track {
          background: #27272A;
          border-radius: 3px;
        }
        
        div[style*="overflow-x: auto"]::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #FFA500, #FF8C00);
          border-radius: 3px;
          border: 1px solid #27272A;
        }
      `}</style>
      <style>{`
        @media print {
          .design-thumb {
            width: 240px !important;
            height: auto !important;
          }
          .file-row {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .file-row a {
            display: none;
          }
        }
      `}</style>

      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobile={isMobile}
      />

      <main style={styles.mainContent}>
        <header style={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 style={styles.title}>Order Management</h1>
            <div style={styles.date}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </motion.div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </header>

        {error && (
          <motion.div
            style={styles.error}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
            <button
              onClick={fetchOrders}
              style={{ ...styles.actionButton("#FFA500"), marginTop: "1rem" }}
            >
              <FiRefreshCw /> Try Again
            </button>
          </motion.div>
        )}

        {/* Filters Section */}
        <motion.div
          style={styles.filtersContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div
            style={styles.filtersHeader}
            onClick={() => setShowFilters(!showFilters)}
          >
            <div style={styles.filtersTitle}>
              <FiFilter /> Filters & Search
              {showFilters ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {!showFilters && (
              <div style={{ color: "#A1A1AA", fontSize: "0.9rem" }}>
                {filteredOrders.length} orders found
              </div>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                style={styles.filtersContent}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div style={styles.searchBox}>
                  <FiSearch style={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search by Order ID, Name, Email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>From Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, start: e.target.value })
                    }
                    style={styles.dateInput}
                  />
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>To Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, end: e.target.value })
                    }
                    style={styles.dateInput}
                  />
                </div>

                <div style={styles.actionButtons}>
                  <button
                    onClick={exportToCSV}
                    style={styles.actionButton("#4CAF50")}
                  >
                    <FiDownload /> Export CSV
                  </button>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("");
                      setDateRange({ start: "", end: "" });
                    }}
                    style={styles.actionButton("#F44336")}
                  >
                    <FiX /> Clear
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingRing}></div>
            <div style={styles.loadingText}>Loading Orders...</div>
          </div>
        ) : (
          <motion.div
            style={styles.ordersCard}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div style={styles.ordersHeader}>
              <div style={styles.resultsCount}>
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
              <button
                onClick={fetchOrders}
                style={{
                  ...styles.actionButton("#2196F3"),
                  display: window.innerWidth <= 768 ? "none" : "inline-block",
                }}
              >
                <FiRefreshCw /> Refresh
              </button>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th
                      style={styles.th}
                      onClick={() => requestSort("created_at")}
                    >
                      Date{" "}
                      {sortConfig.key === "created_at" && (
                        <span style={styles.sortIndicator}>
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                    <th
                      style={styles.th}
                      onClick={() => requestSort("customer_name")}
                    >
                      Customer{" "}
                      {sortConfig.key === "customer_name" && (
                        <span style={styles.sortIndicator}>
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                    <th style={styles.th}>Product</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th} onClick={() => requestSort("total")}>
                      Total{" "}
                      {sortConfig.key === "total" && (
                        <span style={styles.sortIndicator}>
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Payment</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={styles.noOrders}>
                        No orders found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.order_id}>
                        <td style={styles.td}>
                          {formatDDMMYYYY(order.created_at)}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.customerInfo}>
                            <div style={styles.customerName}>{getCustomerDisplayName(order)}</div>
                            <div style={styles.customerEmail}>
                              {order.customer_info?.email ||
                                order.customer_email ||
                                "N/A"}
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div
                            style={styles.productName}
                            title={order.product_name}
                          >
                            {order.product_name ||
                              (order.items && order.items[0]?.product_name) ||
                              "N/A"}
                          </div>
                        </td>
                        <td style={styles.td}>{getProductQuantity(order)}</td>
                        <td style={{ ...styles.td, ...styles.totalAmount }}>
                          ${order.totals?.total || "0.00"}
                        </td>
                        <td style={styles.td}>
                          {(() => {
                            const viewedMap = JSON.parse(localStorage.getItem('viewed_orders') || '{}');
                            const isViewed = !!viewedMap[order.order_id];
                            const isPending = String(order.status || '').toLowerCase() === 'pending' || !order.status;
                            const displayStatus = !isViewed && isPending ? 'New order' : (order.status || 'Pending');
                            return (
                              <span style={styles.status(displayStatus)}>
                                {displayStatus}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={styles.td}>
                          {order.payment_method === "paypal"
                            ? "PayPal"
                            : order.payment_method === "stripe"
                            ? "Stripe"
                            : order.payment_method || "N/A"}
                        </td>
                        <td style={styles.td}>
                          <button
                            onClick={() => viewOrderDetails(order.order_id)}
                            style={styles.viewButton}
                          >
                            <FiEye /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.header}>
              <div style={modalStyles.headerLeft}>
                <h2 style={modalStyles.headerTitle}>
                  Order #{selectedOrder.order_id}
                </h2>
                <div style={modalStyles.statusRow}>
                  <span style={{ color: "#A1A1AA", fontWeight: "600" }}>
                    Status:
                  </span>
                  <span style={styles.status(selectedOrder.status)}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>
              <div style={modalStyles.headerRight}>
                <button
                  onClick={() => generateOrderPDF(selectedOrder)}
                  style={modalStyles.modernButton("#FFA500", "#FF8C00", "#18181B")}
                >
                  <FiDownload /> Download Order
                </button>
                <button
                  onClick={() => generateDeliveryPDF(selectedOrder)}
                  style={modalStyles.modernButton("#34A853", "#2ECC71", "#18181B")}
                >
                  <FiTruck /> Delivery Note
                </button>
                <div style={modalStyles.statusUpdateGroup}>
                  <span style={modalStyles.statusUpdateLabel}>
                    Update Status:
                  </span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) =>
                      updateOrderStatus(selectedOrder.order_id, e.target.value)
                    }
                    style={modalStyles.statusUpdateSelect}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowOrderModal(false)}
                  style={modalStyles.closeButton}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div style={modalStyles.contentScroll}>
              {/* Order Summary Cards */}
              <div style={modalStyles.summaryGrid}>
                <div style={modalStyles.summaryCard("#FFA500")}>
                  <div style={modalStyles.summaryCardHeader("#FFA500")}>
                    <FiCalendar />
                    <span>Order Date</span>
                  </div>
                  <div style={modalStyles.summaryCardValue}>
                    {new Date(selectedOrder.created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </div>
                </div>

                <div style={modalStyles.summaryCard("#4CAF50")}>
                  <div style={modalStyles.summaryCardHeader("#4CAF50")}>
                    <FiTruck />
                    <span>Delivery Status</span>
                  </div>
                  <div style={modalStyles.summaryCardValue}>
                    {selectedOrder.status === "Delivered"
                      ? new Date(
                          selectedOrder.delivered_at || selectedOrder.updated_at || Date.now()
                        ).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                      : "Not delivered yet"}
                  </div>
                </div>

                <div style={modalStyles.summaryCard("#9C27B0")}>
                  <div style={modalStyles.summaryCardHeader("#9C27B0")}>
                    <FiCreditCard />
                    <span>Total Amount</span>
                  </div>
                  <div style={modalStyles.summaryCardValue}>
                    ${selectedOrder.totals?.total || "0.00"}
                  </div>
                </div>
              </div>

              <div style={modalStyles.contentGrid}>
                {/* Customer Information */}
                <div style={modalStyles.section}>
                  <h3 style={modalStyles.sectionTitle}>
                    <FiUser /> Customer Information
                  </h3>
                  <div style={modalStyles.sectionContent}>
                    <div style={modalStyles.infoRow}>
                      <span style={modalStyles.infoLabel}>Name</span>
                      <span style={modalStyles.infoValue}>
                        {getCustomerDisplayName(selectedOrder)}
                      </span>
                    </div>
                    <div style={modalStyles.infoRow}>
                      <span style={modalStyles.infoLabel}>Email</span>
                      <span style={modalStyles.infoValue}>
                        {selectedOrder.customer_info?.email ||
                          selectedOrder.customer_email ||
                          "N/A"}
                      </span>
                    </div>
                    <div style={modalStyles.infoRow}>
                      <span style={modalStyles.infoLabel}>Phone</span>
                      <span style={modalStyles.infoValue}>
                        {selectedOrder.customer_info?.phone ||
                          selectedOrder.customer_phone ||
                          "N/A"}
                      </span>
                    </div>
                    {selectedOrder.customer_info?.company && (
                      <div style={modalStyles.infoRow}>
                        <span style={modalStyles.infoLabel}>Company</span>
                        <span style={modalStyles.infoValue}>
                          {selectedOrder.customer_info.company}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div style={modalStyles.section}>
                  <h3 style={modalStyles.sectionTitle}>
                    <FiMapPin /> Shipping Address
                  </h3>
                  <div style={modalStyles.sectionContent}>
                    <div style={modalStyles.infoRow}>
                      <span style={modalStyles.infoLabel}>Address</span>
                      <span style={modalStyles.infoValue}>
                        {selectedOrder.shipping_address?.address ||
                          selectedOrder.customer_info?.address}
                      </span>
                    </div>
                    <div style={modalStyles.infoRow}>
                      <span style={modalStyles.infoLabel}>
                        City, State, Zip
                      </span>
                      <span style={modalStyles.infoValue}>
                        {selectedOrder.shipping_address?.city ||
                          selectedOrder.customer_info?.city}
                        ,{" "}
                        {selectedOrder.shipping_address?.state ||
                          selectedOrder.customer_info?.state}{" "}
                        {selectedOrder.shipping_address?.zip ||
                          selectedOrder.customer_info?.zip}
                      </span>
                    </div>
                    <div style={modalStyles.infoRow}>
                      <span style={modalStyles.infoLabel}>Country</span>
                      <span style={modalStyles.infoValue}>
                        {selectedOrder.shipping_address?.country ||
                          selectedOrder.customer_info?.country}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div style={{ ...modalStyles.section, marginBottom: "2rem" }}>
                <h3 style={modalStyles.sectionTitle}>
                  <FiPackage /> Order Items
                </h3>
                <div style={modalStyles.sectionContent}>
                  {selectedOrder.items && Array.isArray(selectedOrder.items) ? (
                    selectedOrder.items.map((item, index) => (
                      <div key={index} style={modalStyles.itemCard}>
                        <div style={modalStyles.itemDetails}>
                          {getProductImage(selectedOrder) && (
                            <img
                              src={getProductImage(selectedOrder)}
                              alt={item.product_name}
                              style={modalStyles.itemImage}
                            />
                          )}
                          <div>
                            <div style={modalStyles.itemName}>
                              {item.product_name || item.name}
                            </div>
                            <div style={modalStyles.itemQty}>
                              Qty:{" "}
                              {item.quantity ||
                                getProductQuantity(selectedOrder)}
                            </div>
                          </div>
                        </div>

                        <div style={modalStyles.itemPrice}>
                          <div style={modalStyles.totalLabel}>
                            Total Amount:
                          </div>
                          $
                          {(
                            (item.discounted_price || item.price || 0) *
                            (item.quantity || 1)
                          ).toFixed(2)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "white" }}>
                      {selectedOrder.product_name || "Product"} ×{" "}
                      {getProductQuantity(selectedOrder)}
                    </div>
                  )}
                </div>
              </div>

              {/* Customization Details */}
              {selectedOrder.customization_data && (
                <div style={{ ...modalStyles.section, marginBottom: "2rem" }}>
                  <h3 style={modalStyles.sectionTitle}>
                    <FiFileText /> Customization Details
                  </h3>
                  <div style={modalStyles.sectionContent}>
                    {/* Customization Notes */}
                    {selectedOrder.customization_data.notes && (
                      <div
                        style={{ ...modalStyles.infoRow, marginBottom: "1rem" }}
                      >
                        <span style={modalStyles.infoLabel}>
                          Customization Notes:
                        </span>
                        <div
                          style={{
                            color: "white",
                            marginTop: "8px",
                            padding: "12px",
                            backgroundColor: "#18181B",
                            borderRadius: "6px",
                            border: "1px solid #3F3F46",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {selectedOrder.customization_data.notes}
                        </div>
                      </div>
                    )}

                    {/* Customization Slots */}
                    {selectedOrder.customization_data.customizationData
                      ?.slots && (
                      <div style={modalStyles.infoRow}>
                        <span style={modalStyles.infoLabel}>
                          Customization Slots:
                        </span>
                        <div style={{ marginTop: "12px" }}>
                          {selectedOrder.customization_data.customizationData.slots.map(
                            (slot, index) => (
                              <div
                                key={index}
                                style={modalStyles.customizationSlot}
                              >
                                <div style={modalStyles.slotHeader}>
                                  <span style={modalStyles.slotTitle}>
                                    Slot {index + 1} - {slot.quantity} units
                                  </span>
                                  {(slot.color || slot.customColor) && (
                                    <span style={modalStyles.slotColor}>
                                      {slot.color || slot.customColor}
                                    </span>
                                  )}
                                </div>

                                {(slot.color || slot.customColor) && (
                                  <div
                                    style={{
                                      marginTop: "4px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        color: "#A1A1AA",
                                        fontSize: "0.9rem",
                                      }}
                                    >
                                      Color:
                                    </div>
                                    <div style={modalStyles.slotColor}>
                                      {slot.color || slot.customColor}
                                    </div>
                                    {slot.customColor &&
                                      /^#?[0-9A-Fa-f]{6}$/.test(
                                        slot.customColor
                                      ) && (
                                        <div
                                          aria-hidden
                                          title={slot.customColor}
                                          style={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: 3,
                                            border:
                                              "1px solid rgba(255,255,255,0.12)",
                                            backgroundColor: slot.customColor.startsWith('#')
                                              ? slot.customColor
                                              : '#' + slot.customColor,
                                          }}
                                        />
                                      )}
                                  </div>
                                )}

                                {/* Size Breakdown */}
                                {slot.sizes &&
                                  Object.keys(slot.sizes).length > 0 && (
                                    <div style={{ marginTop: "8px" }}>
                                      <div
                                        style={{
                                          color: "#A1A1AA",
                                          fontSize: "0.9rem",
                                          marginBottom: "6px",
                                        }}
                                      >
                                        Size Breakdown:
                                      </div>
                                      <div style={modalStyles.sizeGrid}>
                                        {Object.entries(slot.sizes).map(
                                          ([size, qty]) => (
                                            <div
                                              key={size}
                                              style={modalStyles.sizePill}
                                            >
                                              {size}: {qty}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Slot Notes */}
                                {slot.notes && (
                                  <div style={modalStyles.slotNotes}>
                                    {slot.notes}
                                  </div>
                                )}

                                {/* Slot Uploaded Files */}
                                {Array.isArray(slot.uploadedFiles) &&
                                  slot.uploadedFiles.length > 0 && (
                                    <div style={{ marginTop: "8px" }}>
                                      <div
                                        style={{
                                          color: "#A1A1AA",
                                          fontSize: "0.9rem",
                                          marginBottom: "6px",
                                        }}
                                      >
                                        Uploaded Design Files (Slot-wise):
                                      </div>
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "0.5rem",
                                        }}
                                      >
                                        {slot.uploadedFiles.map((file, fIdx) => {
                                          const href = file?.url || "";
                                          const isImage =
                                            (file?.type && file.type.startsWith("image/")) ||
                                            /\.(png|jpe?g|gif|webp|bmp)$/i.test(file?.name || "");
                                          return (
                                            <div
                                              key={fIdx}
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                padding: "10px 12px",
                                                backgroundColor: "#18181B",
                                                borderRadius: "8px",
                                                border: "1px solid #3F3F46",
                                              }}
                                              className="file-row"
                                            >
                                              {isImage && href ? (
                                                <img
                                                  src={href}
                                                  alt={file?.name || `File ${fIdx + 1}`}
                                                  style={{
                                                    width: 120,
                                                    height: 90,
                                                    objectFit: "cover",
                                                    borderRadius: 6,
                                                    border: "1px solid #2E2E33",
                                                  }}
                                                  className="design-thumb"
                                                />
                                              ) : (
                                                <FiFileText style={{ color: "#FFA500" }} />
                                              )}
                                              <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span style={{ color: "white", fontSize: "14px" }}>
                                                  {file?.name || `File ${fIdx + 1}`}
                                                </span>
                                                {href && (
                                                  <a
                                                    href={href}
                                                    download={file?.name || `file_${fIdx + 1}`}
                                                    style={{ color: "#FFA500", fontSize: "12px" }}
                                                  >
                                                    Download
                                                  </a>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Uploaded Files */}
                    {selectedOrder.customization_data.customizationData
                      ?.uploadedFiles &&
                      selectedOrder.customization_data.customizationData
                        .uploadedFiles.length > 0 && (
                        <div
                          style={{ ...modalStyles.infoRow, marginTop: "1rem" }}
                        >
                          <span style={modalStyles.infoLabel}>
                            Uploaded Files:
                          </span>
                          <div
                            style={{
                              marginTop: "8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.5rem",
                            }}
                          >
                            {selectedOrder.customization_data.customizationData.uploadedFiles.map(
                              (file, index) => {
                                const href = file?.url || "";
                                const isImage =
                                  (file?.type && file.type.startsWith("image/")) ||
                                  /\.(png|jpe?g|gif|webp|bmp)$/i.test(file?.name || "");
                                return (
                                  <div
                                    key={index}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "12px",
                                      padding: "10px 12px",
                                      backgroundColor: "#18181B",
                                      borderRadius: "8px",
                                      border: "1px solid #3F3F46",
                                    }}
                                    className="file-row"
                                  >
                                    {isImage && href ? (
                                      <img
                                        src={href}
                                        alt={file?.name || `File ${index + 1}`}
                                        style={{
                                          width: 120,
                                          height: 90,
                                          objectFit: "cover",
                                          borderRadius: 6,
                                          border: "1px solid #2E2E33",
                                        }}
                                        className="design-thumb"
                                      />
                                    ) : (
                                      <FiFileText style={{ color: "#FFA500" }} />
                                    )}
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                      <span style={{ color: "white", fontSize: "14px" }}>
                                        {file?.name || `File ${index + 1}`}
                                      </span>
                                      {href && (
                                        <a
                                          href={href}
                                          download={file?.name || `file_${index + 1}`}
                                          style={{ color: "#FFA500", fontSize: "12px" }}
                                        >
                                          Download
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
