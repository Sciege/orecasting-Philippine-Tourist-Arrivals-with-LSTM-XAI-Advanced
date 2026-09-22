# backend/state.py
# Replaces st.session_state — one shared dict that all routers read/write.
# For a multi-user deployment you would replace this with a proper store
# (Redis, a database, or per-session files).  For a single-user dev environment
# this is the simplest equivalent to Streamlit's session_state.

pipeline: dict = {}
