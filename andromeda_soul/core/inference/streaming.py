"""
Andromeda Streaming Token Generator Generator / Async Queue
"""

import asyncio
from typing import AsyncGenerator

class TokenStreamer:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.finished = False

    async def put(self, token: str):
        await self.queue.put(token)

    async def finish(self):
        self.finished = True
        await self.queue.put(None)

    async def __aiter__(self) -> AsyncGenerator[str, None]:
        while True:
            token = await self.queue.get()
            if token is None:
                break
            yield token
