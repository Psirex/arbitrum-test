// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {IERC20} from "./interfaces/IERC20.sol";

contract DummyERC20Token is IERC20 {
    uint8 public immutable decimals;
    address public immutable minter;

    bytes32 private immutable _name;
    bytes32 private immutable _symbol;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 premint
    ) {
        minter = msg.sender;
        decimals = decimals_;
        _name = bytes32(bytes(name_));
        _symbol = bytes32(bytes(symbol_));

        if (premint > 0) {
            _mint(minter, premint);
        }
    }

    function name() public view returns (string memory) {
        return string(abi.encodePacked(_name));
    }

    function symbol() public view returns (string memory) {
        return string(abi.encodePacked(_symbol));
    }

    function approve(address spender, uint256 amount)
        public
        returns (bool success)
    {
        allowance[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount)
        public
        returns (bool success)
    {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public returns (bool success) {
        _spendAllowance(from, to, amount);
        _transfer(from, to, amount);
        return true;
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal onlyNonZeroAccount(from) onlyNonZeroAccount(to) {
        if (amount > balanceOf[from]) {
            revert NotEnoughBalance();
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _spendAllowance(
        address owner,
        address spender,
        uint256 amount
    ) internal {
        uint256 currentAllowance = allowance[owner][spender];
        if (amount > currentAllowance) {
            revert NotEnoughAllowance();
        }
        allowance[owner][spender] -= currentAllowance;
    }

    function _mint(address account_, uint256 amount_)
        internal
        onlyNonZeroAccount(account_)
    {
        totalSupply += amount_;
        balanceOf[account_] += amount_;
        emit Transfer(address(0), account_, amount_);
    }

    function _burn(address account_, uint256 amount_)
        internal
        onlyNonZeroAccount(account_)
    {
        balanceOf[account_] -= amount_;
        totalSupply -= amount_;
        emit Transfer(account_, address(0), amount_);
    }

    modifier onlyNonZeroAccount(address account_) {
        if (account_ == address(0)) {
            revert ZeroAddress();
        }
        _;
    }

    modifier onlyMinter() {
        if (msg.sender != minter) {
            revert NotMinter();
        }
        _;
    }

    error NotMinter();
    error ZeroAddress();
    error NotEnoughBalance();
    error NotEnoughAllowance();
}
