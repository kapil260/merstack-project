import { Pencil, Trash2 } from "lucide-react";
import { CATEGORY_COLORS, formatDate, formatNPR } from "../utils/format.js";

// One expense shown as a row/card. Edit and delete buttons only appear if the functions are given.
const ExpenseCard = ({ expense, onEdit, onDelete }) => (
  <div className="expense-card">
    <span className="dot" style={{ background: CATEGORY_COLORS[expense.category] }}></span>
    <div className="expense-info">
      <strong>{expense.title}</strong>
      <small>
        {expense.category} • {formatDate(expense.date)}
      </small>
    </div>
    <span className="expense-amount">{formatNPR(expense.amount)}</span>
    {onEdit && (
      <button className="icon-btn" title="Edit" onClick={() => onEdit(expense)}>
        <Pencil size={16} />
      </button>
    )}
    {onDelete && (
      <button className="icon-btn danger" title="Delete" onClick={() => onDelete(expense)}>
        <Trash2 size={16} />
      </button>
    )}
  </div>
);

export default ExpenseCard;
