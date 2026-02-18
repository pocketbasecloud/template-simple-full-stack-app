import { useEffect, useState } from "react";
import pb from "../lib/pb";
import type { Todo } from "../types";

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);

  const userId = pb.authStore.record?.id;

  async function loadTodos() {
    try {
      const records = await pb.collection("todos").getFullList<Todo>({
        sort: "-created",
        filter: `user = "${userId}"`,
      });
      setTodos(records);
    } catch {
      // collection may not exist yet
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTodos();
  }, []);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    await pb.collection("todos").create<Todo>({
      text: newText.trim(),
      completed: false,
      user: userId,
    });
    setNewText("");
    loadTodos();
  }

  async function toggleTodo(todo: Todo) {
    await pb.collection("todos").update<Todo>(todo.id, {
      completed: !todo.completed,
    });
    loadTodos();
  }

  async function deleteTodo(id: string) {
    await pb.collection("todos").delete(id);
    loadTodos();
  }

  if (loading) return <div className="card"><p>Loading todos...</p></div>;

  return (
    <div className="todo-section">
      <h3>Todo List</h3>
      <form className="todo-form" onSubmit={addTodo}>
        <input
          type="text"
          placeholder="Add a todo..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.completed ? "completed" : ""}>
            <label>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo)}
              />
              <span>{todo.text}</span>
            </label>
            <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>
              ×
            </button>
          </li>
        ))}
        {todos.length === 0 && <li className="empty">No todos yet</li>}
      </ul>
    </div>
  );
}
